// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Export API_BASE_URL so other components can use it
export { API_BASE_URL };

export const isTimeLockError = () => false;

// Helper function to get auth token from localStorage
// Checks both 'token' and 'access_token' for backward compatibility
const getToken = () => {
  // First try 'token' (current standard)
  const token = localStorage.getItem('token');
  if (token) return token;
  
  // Fallback to 'access_token' (legacy/migration support)
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    // Migrate to 'token' for consistency
    localStorage.setItem('token', accessToken);
    localStorage.removeItem('access_token');
    return accessToken;
  }
  
  return null;
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/* =========================
   AUTH API
========================= */
export const authAPI = {
  login: async (email, password) => {
    const endpoint = email === 'admin@gmail.com' ? '/admin/login' : '/auth/login';

    // ✅ Ensure request body is correctly formatted
    const requestBody = { email, password };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Get detailed error information
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        // Handle validation errors (422) with detailed messages
        if (response.status === 422 && errorData.errors) {
          const firstError = errorData.errors[0];
          const field = firstError.loc?.join('.') || 'field';
          errorDetail = `${field}: ${firstError.msg}`;
        } else {
          errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        }
      } catch (e) {
        // If JSON parsing fails, use status text
        console.error('Failed to parse error response:', e);
      }
      
      // Log for debugging
      console.error('Login error:', {
        status: response.status,
        statusText: response.statusText,
        detail: errorDetail,
        endpoint,
        email: email ? 'provided' : 'missing',
        password: password ? 'provided' : 'missing'
      });
      
      throw new Error(errorDetail || 'Invalid email or password');
    }

    return response.json(); // { access_token, token_type }
  },

  // Register remains unchanged
  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

/* =========================
   PRODUCTS API
========================= */
export const productsAPI = {
  list: (category = null, searchQuery = null, farmerId = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (searchQuery) params.append('q', searchQuery);
    if (farmerId != null) params.append('farmer_id', farmerId);
    const query = params.toString();
    return apiRequest(`/products/${query ? `?${query}` : ''}`);
  },

  get: (productId) => apiRequest(`/products/${productId}`),

  create: (productData) =>
    apiRequest('/products/', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  update: (productId, productData) =>
    apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  delete: (productId) =>
    apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    }),
};

/* =========================
   NEGOTIATION API (dedicated page, not in chat)
========================= */
export const negotiationAPI = {
  start: (productId) =>
    apiRequest('/negotiations/start?product_id=' + productId, { method: 'POST' }),
  get: (negotiationId) => apiRequest('/negotiations/' + negotiationId),
  sendOffer: (negotiationId, pricePerUnit) =>
    apiRequest('/negotiations/' + negotiationId + '/offer', {
      method: 'POST',
      body: JSON.stringify({ price_per_unit: pricePerUnit }),
    }),
  confirm: (negotiationId) =>
    apiRequest('/negotiations/' + negotiationId + '/confirm', { method: 'POST' }),
  clear: (negotiationId) =>
    apiRequest('/negotiations/' + negotiationId + '/clear', { method: 'POST' }),
};

/* =========================
   CART API
========================= */
export const cartAPI = {
  get: () => apiRequest('/cart/'),

  add: (productId, quantity) =>
    apiRequest('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  update: (itemId, quantity) =>
    apiRequest(`/cart/update/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  remove: (itemId) =>
    apiRequest(`/cart/remove/${itemId}`, {
      method: 'DELETE',
    }),

  checkout: () =>
    apiRequest('/cart/checkout', {
      method: 'POST',
    }),
};

/* =========================
   ORDERS API
========================= */
export const ordersAPI = {
  list: () => apiRequest('/orders/'),

  get: (orderId) => apiRequest(`/orders/${orderId}`),

  create: (orderData) =>
    apiRequest('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  updateStatus: (orderId, status) =>
    apiRequest(`/orders/${orderId}/status?new_status=${status}`, {
      method: 'PUT',
    }),

  cancel: (orderId, reason) =>
    apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getOrderNotifications: () => apiRequest('/orders/notifications'),

  markOrderNotificationRead: (notificationId) =>
    apiRequest(`/orders/notifications/${notificationId}/read`, {
      method: 'POST',
    }),

  deleteNotification: (notificationId) =>
    apiRequest(`/orders/notifications/${notificationId}`, {
      method: 'DELETE',
    }),

  clearAllNotifications: () =>
    apiRequest('/orders/notifications', {
      method: 'DELETE',
    }),
};

/* =========================
   DASHBOARD API
========================= */
export const dashboardAPI = {
  farmer: () => apiRequest('/dashboard/farmer'),
  buyer: () => apiRequest('/dashboard/buyer'),
};

// Market Prices API (Kerala real-time prices from government data)
export const marketPricesAPI = {
  get: (district, commodity) => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (commodity) params.append('commodity', commodity);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/market-prices${query}`);
  },
};

/* =========================
   MESSAGING API
========================= */
export const messagingAPI = {
  listConversations: () => apiRequest('/messaging/conversations'),

  getOrCreateConversation: (counterpartId) =>
    apiRequest(`/messaging/conversations?counterpart_id=${counterpartId}`, {
      method: 'POST',
    }),

  getMessages: (conversationId) =>
    apiRequest(`/messaging/conversations/${conversationId}/messages`),

  sendMessage: (conversationId, messageText, fileUrl = null, fileType = null, fileName = null) =>
    apiRequest('/messaging/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        message_text: messageText,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
      }),
    }),

  getUnreadCount: () => apiRequest('/messaging/unread-count'),

  markConversationRead: (conversationId) =>
    apiRequest(`/messaging/conversations/${conversationId}/mark-read`, {
      method: 'POST',
    }),

  // Price negotiation (counter-offer)
  sendCounterOffer: (conversationId, productId, quantity, pricePerUnit) =>
    apiRequest(`/messaging/conversations/${conversationId}/counter-offer`, {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity: Number(quantity),
        price_per_unit: Number(pricePerUnit),
      }),
    }),

  acceptCounterOffer: (messageId) =>
    apiRequest(`/messaging/messages/${messageId}/counter-offer/accept`, {
      method: 'POST',
    }),

  rejectCounterOffer: (messageId) =>
    apiRequest(`/messaging/messages/${messageId}/counter-offer/reject`, {
      method: 'POST',
    }),

  // Admin messages for farmers
  getAdminMessages: () => apiRequest('/messaging/admin-messages'),
  
  getAdminMessagesUnreadCount: () => apiRequest('/messaging/admin-messages/unread-count'),

  // Group chat ("Free to Ask")
  getDefaultFarmerGroup: () => apiRequest('/messaging/groups/default-farmer'),

  getDefaultFarmerGroupActivityCount: () =>
    apiRequest('/messaging/groups/default-farmer/activity-count'),

  markGroupAsSeen: (groupId) =>
    apiRequest(`/messaging/groups/${groupId}/seen`, { method: 'POST' }),

  getGroupMessages: (groupId) =>
    apiRequest(`/messaging/groups/${groupId}/messages`),

  sendGroupMessage: (groupId, messageText, fileUrl = null, fileType = null, fileName = null) =>
    apiRequest(`/messaging/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message_text: messageText,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
      }),
    }),

  removeGroupMember: (groupId, userId) =>
    apiRequest(`/messaging/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  // File upload
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload file');
    }
    
    return response.json();
  },
};

/* =========================
   USER API
========================= */
export const userAPI = {
  getProfile: () => apiRequest('/users/me'),

  updateProfile: (userData) =>
    apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  toggleActiveStatus: () =>
    apiRequest('/users/me/toggle-active', {
      method: 'PUT',
    }),
};

/* =========================
   POLICIES API
========================= */
export const policiesAPI = {
  list: () => apiRequest('/policies/'),
  notifications: () => apiRequest('/policies/notifications'),
  markRead: (notificationId) =>
    apiRequest(`/policies/notifications/${notificationId}/read`, {
      method: 'POST',
    }),
};

/* =========================
   RATINGS API
========================= */
export const ratingsAPI = {
  create: (orderId, rating, comment) =>
    apiRequest('/ratings/', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, rating, comment }),
    }),

  getFarmerRatings: (farmerId) =>
    apiRequest(`/ratings/farmer/${farmerId}`),

  getOrderRating: (orderId) =>
    apiRequest(`/ratings/order/${orderId}`),
};

export const complaintsAPI = {
  create: (orderId, complaintType, description) =>
    apiRequest('/complaints/', {
      method: 'POST',
      body: JSON.stringify({ 
        order_id: orderId, 
        complaint_type: complaintType, 
        description 
      }),
    }),

  getOrderComplaints: (orderId) =>
    apiRequest(`/complaints/order/${orderId}`),
};

/* =========================
   NEWS API (Government News)
========================= */
export const newsAPI = {
  list: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.category) queryParams.append('category', params.category);
    if (params.important_only) queryParams.append('important_only', params.important_only);
    const query = queryParams.toString();
    return apiRequest(`/news/${query ? `?${query}` : ''}`);
  },

  get: (newsId) => apiRequest(`/news/${newsId}`),

  fetch: () =>
    apiRequest('/news/fetch', {
      method: 'POST',
    }),

  getCategories: () => apiRequest('/news/categories/list'),
  
  // Translation endpoints
  getLanguages: () => apiRequest('/news/languages'),
  
  translate: (newsId, lang) => apiRequest(`/news/translate/${newsId}?lang=${lang}`),
};

/* =========================
   ADMIN SETTINGS API
========================= */
export const adminSettingsAPI = {
  getNewsSettings: () => apiRequest('/admin/settings/news'),

  toggleNewsNotifications: () =>
    apiRequest('/admin/settings/news/toggle', {
      method: 'PUT',
    }),
};

export default {
  auth: authAPI,
  products: productsAPI,
  cart: cartAPI,
  orders: ordersAPI,
  dashboard: dashboardAPI,
  messaging: messagingAPI,
  user: userAPI,
  policies: policiesAPI,
  ratings: ratingsAPI,
  complaints: complaintsAPI,
  news: newsAPI,
  adminSettings: adminSettingsAPI,
};
