import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';
import { 
  NewspaperIcon, 
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  TagIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import Toast from './Toast';

function GovernmentNews({ limit = 5, showFullList = false }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [isMuted, setIsMuted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Translation state
  const [languages, setLanguages] = useState({});
  const [selectedLang, setSelectedLang] = useState('');
  const [translatedNews, setTranslatedNews] = useState({});
  const [translating, setTranslating] = useState({});
  const [translationAvailable, setTranslationAvailable] = useState(false);

  useEffect(() => {
    loadNews();
    loadCategories();
    loadLanguages();
  }, [selectedCategory]);

  const loadLanguages = async () => {
    try {
      const response = await newsAPI.getLanguages();
      setLanguages(response.languages || {});
      setTranslationAvailable(response.translation_available || false);
    } catch (err) {
      console.error('Error loading languages:', err);
    }
  };

  const handleTranslate = async (newsId) => {
    if (!selectedLang || selectedLang === 'original') {
      // Reset to original
      setTranslatedNews(prev => {
        const updated = { ...prev };
        delete updated[newsId];
        return updated;
      });
      return;
    }
    
    setTranslating(prev => ({ ...prev, [newsId]: true }));
    try {
      const translated = await newsAPI.translate(newsId, selectedLang);
      setTranslatedNews(prev => ({ ...prev, [newsId]: translated }));
      setToast({ show: true, message: 'Translated successfully!', type: 'success' });
    } catch (err) {
      console.error('Translation error:', err);
      setToast({ show: true, message: 'Translation failed', type: 'error' });
    } finally {
      setTranslating(prev => ({ ...prev, [newsId]: false }));
    }
  };

  const translateAllNews = async () => {
    if (!selectedLang || selectedLang === 'original') {
      setTranslatedNews({});
      return;
    }
    
    // Translate all news items sequentially
    const newTranslations = {};
    for (const item of news) {
      try {
        const translated = await newsAPI.translate(item.id, selectedLang);
        newTranslations[item.id] = translated;
      } catch (err) {
        console.error(`Translation error for news ${item.id}:`, err);
      }
    }
    
    setTranslatedNews(newTranslations);
    if (Object.keys(newTranslations).length > 0) {
      setToast({ show: true, message: `Translated ${Object.keys(newTranslations).length} news items!`, type: 'success' });
    }
  };

  const loadNews = async () => {
    try {
      setLoading(true);
      const params = {
        limit: showFullList ? 20 : limit,
        ...(selectedCategory && { category: selectedCategory }),
      };
      const response = await newsAPI.list(params);
      setNews(response.news || []);
      setError('');
      // Backend currently doesn't return an explicit "muted" flag,
      // so treat empty list as "no news" instead of "muted".
      setIsMuted(false);
    } catch (err) {
      console.error('Error loading news:', err);
      setError(err.message || 'Failed to load government news');
      setToast({ show: true, message: 'Failed to load news', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Trigger backend to fetch fresh news
      await newsAPI.fetch();
      setToast({ show: true, message: 'Fetching latest news...', type: 'info' });
      // Wait a bit then reload
      setTimeout(() => {
        loadNews();
        setToast({ show: true, message: 'News updated!', type: 'success' });
      }, 2000);
    } catch (err) {
      console.error('Error refreshing news:', err);
      setToast({ show: true, message: 'Failed to refresh news', type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await newsAPI.getCategories();
      setCategories(response.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Date not available';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      MSP: 'bg-yellow-100 text-yellow-800',
      Scheme: 'bg-blue-100 text-blue-800',
      Policy: 'bg-purple-100 text-purple-800',
      Financial: 'bg-green-100 text-green-800',
      Weather: 'bg-cyan-100 text-cyan-800',
      Trade: 'bg-orange-100 text-orange-800',
      General: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.General;
  };

  if (loading && news.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-green-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <NewspaperIcon className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Government News</h3>
        </div>
        <p className="text-center text-gray-500 py-4">Loading news...</p>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-green-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <NewspaperIcon className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Government News</h3>
        </div>
        <p className="text-center text-red-500 py-4">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow border border-green-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NewspaperIcon className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Government News & Updates</h3>
          </div>
          {news.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {news.length} {news.length === 1 ? 'update' : 'updates'}
            </span>
          )}
        </div>

        {/* Language Selector */}
        {translationAvailable && news.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 flex-wrap">
              <LanguageIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Translate News:</span>
              <select
                value={selectedLang}
                onChange={(e) => {
                  const lang = e.target.value;
                  setSelectedLang(lang);
                  if (lang === 'original' || lang === '') {
                    setTranslatedNews({});
                  } else {
                    // Auto-translate all when language is selected
                    translateAllNews();
                  }
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value="original">Show Original</option>
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              {Object.keys(translatedNews).length > 0 && (
                <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  ✓ Translated {Object.keys(translatedNews).length} items
                </span>
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {showFullList && categories.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="w-4 h-4 text-gray-500" />
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  !selectedCategory
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    selectedCategory === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {isMuted ? (
            <div className="text-center py-8">
              <SpeakerXMarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Government news notifications are currently muted</p>
              <p className="text-xs text-gray-500 mt-2">
                Contact admin to enable notifications
              </p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8">
              <NewspaperIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No government news available at the moment</p>
              <p className="text-xs text-gray-400 mt-2 mb-4">
                News is fetched automatically from government RSS feeds
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Fetching...' : 'Fetch Latest News'}
              </button>
            </div>
          ) : (
            news.map((item) => {
              const translated = translatedNews[item.id];
              const displayTitle = translated?.title || item.title;
              const displayDescription = translated?.description || item.description;
              const isTranslated = !!translated;
              
              return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition hover:shadow-md ${
                  item.is_important
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.is_important && (
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                      )}
                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">
                        {displayTitle}
                      </h4>
                      {isTranslated && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Translated
                        </span>
                      )}
                    </div>
                    
                    {displayDescription && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {displayDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(item.published_at)}
                      </div>
                      
                      {item.category && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        Source: {item.source}
                      </span>
                    </div>
                  </div>

                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 text-green-600 hover:bg-green-50 rounded transition"
                      title="Read full article"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>

        {!showFullList && news.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => window.location.href = '/government-news'}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All News →
            </button>
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-right"
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}

export default GovernmentNews;
