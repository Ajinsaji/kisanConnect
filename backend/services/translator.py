"""
Translation service for government news.
Uses deep-translator library for free translations.
"""
import logging
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

# Try to import deep_translator, fall back gracefully if not available
try:
    from deep_translator import GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False
    logger.warning("deep-translator not installed. Translation feature will be disabled.")
    logger.warning("Install with: pip install deep-translator")


# Supported languages for translation
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "bn": "Bengali (বাংলা)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "as": "Assamese (অসমীয়া)",
}


@lru_cache(maxsize=500)
def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    """
    Translate text to target language.
    
    Args:
        text: Text to translate
        target_lang: Target language code (e.g., 'en', 'hi', 'ta')
        source_lang: Source language code or 'auto' for auto-detection
        
    Returns:
        Translated text or original text if translation fails
    """
    if not TRANSLATOR_AVAILABLE:
        return text
    
    if not text or not text.strip():
        return text
    
    # If target is same as source or auto and text is already in target lang
    if target_lang == source_lang:
        return text
    
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return translated if translated else text
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text


def translate_news_item(news_item: dict, target_lang: str) -> dict:
    """
    Translate a news item's title and description.
    
    Args:
        news_item: News item dictionary with 'title', 'description', etc.
        target_lang: Target language code
        
    Returns:
        News item with translated fields
    """
    if not TRANSLATOR_AVAILABLE or target_lang == "auto":
        return news_item
    
    translated_item = news_item.copy()
    
    # Translate title
    if news_item.get('title'):
        translated_item['title'] = translate_text(news_item['title'], target_lang)
    
    # Translate description
    if news_item.get('description'):
        translated_item['description'] = translate_text(news_item['description'], target_lang)
    
    # Keep original for reference
    translated_item['original_title'] = news_item.get('title', '')
    translated_item['translated_to'] = target_lang
    
    return translated_item


def get_supported_languages() -> dict:
    """Return dictionary of supported languages."""
    return SUPPORTED_LANGUAGES


def is_translation_available() -> bool:
    """Check if translation feature is available."""
    return TRANSLATOR_AVAILABLE
