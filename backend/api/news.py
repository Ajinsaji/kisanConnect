"""
API endpoints for government news and notifications.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from core.security import get_current_user_optional, get_db
from db.models import GovernmentNews, User, AppSettings
from schemas.news import NewsListResponse, NewsRead
from services.rss_parser import RSSParser
from services.translator import (
    translate_text, 
    translate_news_item, 
    get_supported_languages, 
    is_translation_available
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/languages")
def get_available_languages():
    """Get list of available languages for translation."""
    return {
        "languages": get_supported_languages(),
        "translation_available": is_translation_available()
    }


@router.get("/translate/{news_id}")
def translate_news(
    news_id: int,
    lang: str = Query(..., description="Target language code (e.g., 'en', 'hi', 'ta')"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Translate a specific news item to the target language.
    """
    news_item = db.get(GovernmentNews, news_id)
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    if not is_translation_available():
        raise HTTPException(
            status_code=503, 
            detail="Translation service not available. Install deep-translator package."
        )
    
    # Convert to dict for translation
    news_dict = {
        'id': news_item.id,
        'title': news_item.title,
        'description': news_item.description,
        'content': news_item.content,
        'source': news_item.source,
        'source_url': news_item.source_url,
        'category': news_item.category,
        'published_at': news_item.published_at,
        'is_important': news_item.is_important,
    }
    
    translated = translate_news_item(news_dict, lang)
    return translated


@router.get("/", response_model=NewsListResponse)
def get_news(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: Optional[str] = Query(default=None),
    important_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Get government news and notifications.
    Available to all authenticated users, but especially relevant for farmers.
    Returns empty list if notifications are muted by admin.
    """
    # Check if news notifications are enabled
    setting = db.query(AppSettings).filter(AppSettings.setting_key == "government_news_enabled").first()
    if setting and setting.setting_value.lower() == "false":
        # News is muted - return empty list
        return NewsListResponse(
            news=[],
            total=0,
            unread_count=0
        )
    
    query = db.query(GovernmentNews)
    
    # Filter by category if provided
    if category:
        query = query.filter(GovernmentNews.category == category)
    
    # Filter important news only
    if important_only:
        query = query.filter(GovernmentNews.is_important == True)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination and ordering
    news_items = (
        query.order_by(desc(GovernmentNews.published_at), desc(GovernmentNews.fetched_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Count unread (news fetched in last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    unread_count = (
        db.query(GovernmentNews)
        .filter(GovernmentNews.fetched_at >= seven_days_ago)
        .count()
    )
    
    return NewsListResponse(
        news=[NewsRead.model_validate(item) for item in news_items],
        total=total,
        unread_count=unread_count
    )


@router.get("/{news_id}", response_model=NewsRead)
def get_news_item(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get a specific news item by ID."""
    news_item = db.get(GovernmentNews, news_id)
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    return NewsRead.model_validate(news_item)


@router.post("/fetch", status_code=status.HTTP_201_CREATED)
def fetch_latest_news(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Manually trigger fetching latest news from RSS feeds.
    Note: In production, this should be done via a scheduled job (cron/background task).
    
    Returns detailed information about the fetch process including any errors.
    """
    try:
        parser = RSSParser()
        news_items = parser.fetch_all_feeds()
        
        added_count = 0
        skipped_count = 0
        errors = []
        
        for item in news_items:
            try:
                # Check if news already exists (by title and source)
                existing = (
                    db.query(GovernmentNews)
                    .filter(
                        GovernmentNews.title == item['title'],
                        GovernmentNews.source == item['source']
                    )
                    .first()
                )
                
                if existing:
                    skipped_count += 1
                    continue
                
                # Create new news entry
                news = GovernmentNews(
                    title=item['title'],
                    description=item.get('description'),
                    content=item.get('content'),
                    source=item['source'],
                    source_url=item.get('source_url'),
                    category=item.get('category'),
                    published_at=item.get('published_at'),
                    is_important=item.get('is_important', False),
                    image_url=item.get('image_url')
                )
                
                db.add(news)
                added_count += 1
            except Exception as e:
                errors.append(f"Error saving news item '{item.get('title', 'Unknown')}': {str(e)}")
                logger.error(f"Error saving news item: {e}")
                continue
        
        db.commit()
        
        response = {
            "message": "News fetch completed",
            "added": added_count,
            "skipped": skipped_count,
            "total_fetched": len(news_items),
            "errors": errors if errors else None
        }
        
        if not news_items:
            response["warning"] = "No news items were fetched. This could be due to: RSS feed URL issues, network problems, or all items being filtered out."
        
        return response
        
    except Exception as e:
        logger.error(f"Error fetching news: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch news: {str(e)}. Check backend logs for details."
        )


@router.get("/categories/list")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Get list of available news categories."""
    categories = (
        db.query(GovernmentNews.category)
        .filter(GovernmentNews.category.isnot(None))
        .distinct()
        .all()
    )
    
    return {
        "categories": [cat[0] for cat in categories if cat[0]]
    }
