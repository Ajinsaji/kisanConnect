"""
RSS Feed Parser for Indian Government Agriculture News
Fetches news from various government and agricultural RSS feeds.
"""
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from urllib.parse import urlparse

import feedparser
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class RSSParser:
    """Parser for RSS feeds from Indian government and agricultural sources."""
    
    # Indian Government and Agricultural RSS Feeds
    RSS_FEEDS = {
        # Agricultural and Rural Development News
        "Agriculture_India": "https://economictimes.indiatimes.com/news/economy/agriculture/rssfeeds/13357316.cms",
        "Rural_Development": "https://economictimes.indiatimes.com/news/economy/policy/rssfeeds/13357295.cms",
        
        # Press Information Bureau - India Government News
        "PIB_Agriculture": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
        
        # Times of India Agriculture
        "TOI_Agriculture": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
        
        # India Today Agriculture
        "IndiaToday": "https://www.indiatoday.in/rss/1206578",
    }
    
    # Backup feeds if primary ones fail
    BACKUP_FEEDS = {
        "Economic_Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        "TOI_India": "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    }
    
    # Keywords to identify agriculture-related news
    AGRICULTURE_KEYWORDS = [
        "farmer", "agriculture", "crop", "msp", "minimum support price",
        "kisan", "krishi", "mandi", "harvest", "irrigation", "fertilizer",
        "seed", "subsidy", "scheme", "yojana", "pm-kisan", "pradhan mantri",
        "foodgrain", "wheat", "rice", "paddy", "pulses", "oilseed", "vegetable",
        "horticulture", "livestock", "dairy", "fishery", "fishing", "rural",
        "farm", "agri", "cultivation", "monsoon", "rainfall", "sowing",
        "procurement", "apmc", "e-nam", "agrimarket", "commodity", "export",
        "import", "tariff", "price", "market", "produce", "grower"
    ]
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
        })
    
    def fetch_feed(self, feed_url: str, source_name: str, filter_agriculture: bool = True) -> List[Dict]:
        """
        Fetch and parse RSS feed.
        
        Args:
            feed_url: URL of the RSS feed
            source_name: Name of the source
            filter_agriculture: Whether to filter for agriculture-related news
            
        Returns:
            List of news items as dictionaries
        """
        news_items = []
        
        try:
            logger.info(f"Fetching RSS feed from {source_name}: {feed_url}")
            
            # Try to fetch the feed
            try:
                response = self.session.get(feed_url, timeout=15)
                response.raise_for_status()
                feed_content = response.text
                feed = feedparser.parse(feed_content)
            except requests.RequestException as e:
                logger.warning(f"HTTP request failed for {source_name}: {e}")
                # Try direct parsing as fallback
                feed = feedparser.parse(feed_url)
            
            if not hasattr(feed, 'entries') or not feed.entries:
                logger.warning(f"No entries found in feed from {source_name}")
                return news_items
            
            logger.info(f"Found {len(feed.entries)} entries in {source_name}")
            
            # Process each entry
            for entry in feed.entries:
                try:
                    title = entry.get('title', '').strip()
                    link = entry.get('link', '')
                    description = entry.get('description', '') or entry.get('summary', '')
                    
                    if not title:
                        continue
                    
                    # Parse published date
                    published_at = self._parse_date(entry)
                    
                    # Check if agriculture-related (skip filter for agriculture-specific feeds)
                    if filter_agriculture and "Agriculture" not in source_name:
                        if not self._is_agriculture_related(title, description):
                            continue
                    
                    # Categorize and process
                    category = self._categorize_news(title, description)
                    is_important = self._is_important_news(title, description)
                    image_url = self._extract_image(entry, description)
                    
                    news_item = {
                        'title': title,
                        'description': self._clean_text(description)[:500],
                        'content': self._clean_text(description),
                        'source': source_name.replace('_', ' '),
                        'source_url': link,
                        'category': category,
                        'published_at': published_at,
                        'is_important': is_important,
                        'image_url': image_url
                    }
                    
                    news_items.append(news_item)
                    
                except Exception as e:
                    logger.debug(f"Error processing entry: {e}")
                    continue
            
            logger.info(f"Processed {len(news_items)} agriculture news from {source_name}")
            
        except Exception as e:
            logger.error(f"Error fetching RSS feed from {source_name}: {e}")
        
        return news_items
    
    def _parse_date(self, entry) -> Optional[datetime]:
        """Parse date from RSS entry."""
        try:
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                return datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
        except Exception:
            pass
        return datetime.now(timezone.utc)
    
    def _is_agriculture_related(self, title: str, description: str) -> bool:
        """Check if news is related to agriculture."""
        if not title and not description:
            return False
        text = (title + " " + (description or "")).lower()
        return any(keyword in text for keyword in self.AGRICULTURE_KEYWORDS)
    
    def _categorize_news(self, title: str, description: str) -> str:
        """Categorize news based on content."""
        text = (title + " " + (description or "")).lower()
        
        if any(word in text for word in ['msp', 'minimum support price', 'support price', 'procurement price']):
            return "MSP"
        elif any(word in text for word in ['scheme', 'yojana', 'program', 'pm-kisan', 'pradhan mantri']):
            return "Scheme"
        elif any(word in text for word in ['policy', 'notification', 'circular', 'law', 'bill', 'act']):
            return "Policy"
        elif any(word in text for word in ['subsidy', 'financial', 'loan', 'credit', 'insurance']):
            return "Financial"
        elif any(word in text for word in ['weather', 'monsoon', 'rain', 'forecast', 'climate']):
            return "Weather"
        elif any(word in text for word in ['export', 'import', 'trade', 'tariff', 'market']):
            return "Trade"
        else:
            return "General"
    
    def _is_important_news(self, title: str, description: str) -> bool:
        """Determine if news is important."""
        text = (title + " " + (description or "")).lower()
        important_keywords = [
            'msp', 'minimum support price', 'announcement', 'launch',
            'new scheme', 'policy change', 'important', 'urgent', 'breaking',
            'pm-kisan', 'budget', 'subsidy increase', 'relief'
        ]
        return any(keyword in text for keyword in important_keywords)
    
    def _extract_image(self, entry, description: str) -> Optional[str]:
        """Extract image URL from RSS entry."""
        # Try media content
        if hasattr(entry, 'media_content') and entry.media_content:
            for media in entry.media_content:
                if 'url' in media:
                    return media['url']
        
        # Try media thumbnail
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            for thumb in entry.media_thumbnail:
                if 'url' in thumb:
                    return thumb['url']
        
        # Try enclosure
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enc in entry.enclosures:
                if enc.get('type', '').startswith('image/'):
                    return enc.get('href') or enc.get('url')
        
        # Try extracting from description HTML
        if description:
            try:
                soup = BeautifulSoup(description, 'html.parser')
                img = soup.find('img')
                if img and img.get('src'):
                    return img['src']
            except Exception:
                pass
        
        return None
    
    def _clean_text(self, text: str) -> str:
        """Clean HTML and normalize text."""
        if not text:
            return ""
        
        try:
            soup = BeautifulSoup(text, 'html.parser')
            cleaned = soup.get_text(separator=' ', strip=True)
            cleaned = re.sub(r'\s+', ' ', cleaned)
            return cleaned.strip()
        except Exception:
            return text.strip()
    
    def fetch_all_feeds(self) -> List[Dict]:
        """Fetch news from all configured RSS feeds."""
        all_news = []
        
        # Try primary feeds
        for source_name, feed_url in self.RSS_FEEDS.items():
            try:
                # For agriculture-specific feeds, don't filter
                filter_agri = "Agriculture" not in source_name
                news_items = self.fetch_feed(feed_url, source_name, filter_agriculture=filter_agri)
                all_news.extend(news_items)
            except Exception as e:
                logger.error(f"Error fetching from {source_name}: {e}")
                continue
        
        # If no news found, try backup feeds
        if not all_news:
            logger.info("No news from primary feeds, trying backup feeds...")
            for source_name, feed_url in self.BACKUP_FEEDS.items():
                try:
                    news_items = self.fetch_feed(feed_url, source_name, filter_agriculture=True)
                    all_news.extend(news_items)
                except Exception as e:
                    logger.error(f"Error fetching backup feed {source_name}: {e}")
                    continue
        
        # If still no news, add sample agriculture news
        if not all_news:
            logger.warning("No news fetched from any feed. Adding sample news.")
            all_news = self._get_sample_news()
        
        # Sort by published date (newest first)
        all_news.sort(key=lambda x: x.get('published_at') or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
        
        # Remove duplicates based on title
        seen_titles = set()
        unique_news = []
        for item in all_news:
            title_key = item['title'].lower()[:50]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_news.append(item)
        
        return unique_news[:50]  # Return max 50 items
    
    def _get_sample_news(self) -> List[Dict]:
        """Return sample agriculture news when feeds fail."""
        now = datetime.now(timezone.utc)
        return [
            {
                'title': 'Government Announces New MSP Rates for Rabi Crops 2024-25',
                'description': 'The Cabinet Committee on Economic Affairs has approved the Minimum Support Prices (MSP) for Rabi crops including wheat, barley, gram, and mustard for the marketing season 2024-25.',
                'content': 'The Cabinet Committee on Economic Affairs has approved the Minimum Support Prices (MSP) for Rabi crops including wheat, barley, gram, and mustard for the marketing season 2024-25. The MSP for wheat has been increased to ensure fair prices for farmers.',
                'source': 'Ministry of Agriculture',
                'source_url': 'https://agricoop.nic.in/',
                'category': 'MSP',
                'published_at': now - timedelta(hours=2),
                'is_important': True,
                'image_url': None
            },
            {
                'title': 'PM-KISAN: 17th Installment to be Released Soon',
                'description': 'The government is preparing to release the 17th installment of PM-KISAN scheme, benefiting over 11 crore farmer families across India with direct benefit transfer.',
                'content': 'The Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) scheme 17th installment is expected to be released soon. Eligible farmers will receive Rs. 2,000 directly in their bank accounts.',
                'source': 'PIB India',
                'source_url': 'https://pmkisan.gov.in/',
                'category': 'Scheme',
                'published_at': now - timedelta(hours=5),
                'is_important': True,
                'image_url': None
            },
            {
                'title': 'Weather Update: IMD Predicts Good Monsoon for Agricultural Season',
                'description': 'Indian Meteorological Department forecasts normal to above-normal monsoon rainfall, bringing positive news for Kharif crop cultivation across the country.',
                'content': 'The India Meteorological Department (IMD) has predicted good monsoon conditions for the upcoming agricultural season. This is expected to benefit farmers cultivating rice, maize, cotton, and other Kharif crops.',
                'source': 'IMD Weather',
                'source_url': 'https://mausam.imd.gov.in/',
                'category': 'Weather',
                'published_at': now - timedelta(hours=8),
                'is_important': False,
                'image_url': None
            },
            {
                'title': 'e-NAM Platform Expands: More Mandis Join Digital Agricultural Market',
                'description': 'The National Agriculture Market (e-NAM) platform continues to expand with more APMCs joining the digital marketplace, enabling farmers to sell produce at better prices.',
                'content': 'The e-NAM platform expansion enables farmers to access markets beyond their local mandis. This digital initiative helps farmers get competitive prices for their agricultural produce.',
                'source': 'Agriculture Ministry',
                'source_url': 'https://enam.gov.in/',
                'category': 'Trade',
                'published_at': now - timedelta(hours=12),
                'is_important': False,
                'image_url': None
            },
            {
                'title': 'Kisan Credit Card: Interest Subvention Scheme Extended',
                'description': 'Government extends interest subvention scheme for Kisan Credit Card loans, providing farmers loans at subsidized interest rates for agricultural activities.',
                'content': 'The government has extended the interest subvention scheme for Kisan Credit Card (KCC) holders. Farmers can avail crop loans up to Rs. 3 lakh at a subsidized interest rate of 4% per annum.',
                'source': 'Finance Ministry',
                'source_url': 'https://www.nabard.org/',
                'category': 'Financial',
                'published_at': now - timedelta(hours=18),
                'is_important': True,
                'image_url': None
            },
            {
                'title': 'Organic Farming: Subsidy Available Under Paramparagat Krishi Vikas Yojana',
                'description': 'Farmers can avail subsidies for organic farming under PKVY scheme. The government provides financial assistance for certification and inputs.',
                'content': 'Under the Paramparagat Krishi Vikas Yojana (PKVY), farmers can get Rs. 50,000 per hectare over three years for organic farming. This includes support for organic inputs, certification, and marketing.',
                'source': 'Agriculture Ministry',
                'source_url': 'https://pgsindia-ncof.gov.in/',
                'category': 'Scheme',
                'published_at': now - timedelta(days=1),
                'is_important': False,
                'image_url': None
            },
        ]
