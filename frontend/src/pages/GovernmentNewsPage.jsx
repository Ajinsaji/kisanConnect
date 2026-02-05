import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';
import CustomerNavbar from '../components/CustomerNavbar';
import FarmerNavbar from '../components/FarmerNavbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { 
  NewspaperIcon, 
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  TagIcon,
  ArrowPathIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

function GovernmentNewsPage() {
  const { user, isAuthenticated } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [fetching, setFetching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    loadNews();
    loadCategories();
  }, [selectedCategory]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 50,
        ...(selectedCategory && { category: selectedCategory }),
      };
      const response = await newsAPI.list(params);
      setNews(response.news || []);
      setError('');
      // Check if muted (empty news with total 0)
      if (response.news && response.news.length === 0 && response.total === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setError(err.message || 'Failed to load government news');
      setToast({ show: true, message: 'Failed to load news', type: 'error' });
    } finally {
      setLoading(false);
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

  const handleFetchNews = async () => {
    try {
      setFetching(true);
      await newsAPI.fetch();
      setToast({ show: true, message: 'News fetched successfully!', type: 'success' });
      await loadNews(); // Reload news after fetching
    } catch (err) {
      console.error('Error fetching news:', err);
      setToast({ show: true, message: err.message || 'Failed to fetch news', type: 'error' });
    } finally {
      setFetching(false);
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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date not available';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      MSP: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Scheme: 'bg-blue-100 text-blue-800 border-blue-300',
      Policy: 'bg-purple-100 text-purple-800 border-purple-300',
      Financial: 'bg-green-100 text-green-800 border-green-300',
      Weather: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      Trade: 'bg-orange-100 text-orange-800 border-orange-300',
      General: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[category] || colors.General;
  };

  const isFarmer = user?.role === 'farmer';

  return (
    <div className="min-h-screen bg-[#f3f7f4]">
      {isFarmer ? (
        <FarmerNavbar activeTab="" />
      ) : (
        <CustomerNavbar title="Government News" />
      )}

      <main className={`max-w-7xl mx-auto px-6 py-8 ${isFarmer ? "md:ml-64" : ""}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <NewspaperIcon className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Government News & Updates</h1>
                <p className="text-gray-600 mt-1">
                  Latest notifications and announcements from Indian government for farmers
                </p>
              </div>
            </div>
            <button
              onClick={handleFetchNews}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? 'Fetching...' : 'Fetch Latest'}
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap bg-white p-4 rounded-lg shadow border border-gray-200">
              <TagIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  !selectedCategory
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All News
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-sm rounded-lg transition border ${
                    selectedCategory === cat
                      ? 'bg-green-600 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* News List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading government news...</p>
          </div>
        ) : error && news.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={loadNews}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        ) : isMuted ? (
          <div className="bg-white rounded-lg shadow p-8 text-center border-2 border-dashed border-gray-300">
            <SpeakerXMarkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-xl font-semibold mb-2">Government News Notifications Muted</p>
            <p className="text-gray-600 text-base">
              Government news notifications are currently disabled by the administrator.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please contact your administrator to enable notifications.
            </p>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <NewspaperIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No news available</p>
            <p className="text-sm text-gray-500 mt-2">
              Click "Fetch Latest" to get the latest government notifications
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow border p-6 transition hover:shadow-lg ${
                  item.is_important
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {item.is_important && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                      )}
                      <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {item.content && item.content !== item.description && (
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        {formatDate(item.published_at)}
                      </div>
                      
                      {item.category && (
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium border ${getCategoryColor(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      )}
                      
                      <span className="text-sm text-gray-500">
                        Source: <strong>{item.source}</strong>
                      </span>
                    </div>
                  </div>

                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-3 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Read full article on government website"
                    >
                      <ArrowTopRightOnSquareIcon className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-right"
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

export default GovernmentNewsPage;
