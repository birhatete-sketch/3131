import axios from 'axios';

const API_BASE = '/api';
const API_V1 = '/api/v1';

const api = axios.create({ baseURL: API_BASE, withCredentials: true });
const apiV1 = axios.create({ baseURL: API_V1, withCredentials: true });

// Customer token interceptor
const setAuthToken = (instance) => {
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('customerToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });
};
setAuthToken(api);
setAuthToken(apiV1);

// ═══════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════
export const productAPI = {
    getAll: (params) => apiV1.get('/products', { params }),
    getBestSellers: (limit = 12) => apiV1.get('/products/best-sellers', { params: { limit } }),
    getById: (id) => apiV1.get(`/products/${id}`),
    search: (term, params = {}) => apiV1.get('/products', { params: { search: term, ...params } }),
    getFeatured: (limit = 8) => apiV1.get('/products', { params: { featured: 'true', limit } }),
    getGoogleReviews: () => apiV1.get('/integrations/google-reviews'),
    getInstagramPosts: () => apiV1.get('/integrations/instagram'),
};

// ═══════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════
export const categoryAPI = {
    getAll: () => apiV1.get('/categories'),
};

// ═══════════════════════════════════════
// CART
// ═══════════════════════════════════════
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (productId, quantity = 1, variant) => api.post('/cart/add', { productId, quantity, variant }),
    update: (productId, quantity, variant) => api.put(`/cart/update/${productId}`, { quantity, variant }),
    remove: (productId) => api.delete(`/cart/remove/${productId}`),
    clear: () => api.delete('/cart/clear'),
    count: () => apiV1.get('/cart/count'),
};

// ═══════════════════════════════════════
// CUSTOMER AUTH
// ═══════════════════════════════════════
export const authAPI = {
    register: (data) => api.post('/customers/register', data),
    login: (data) => api.post('/customers/login', data),
    logout: () => api.get('/customers/logout'),
    getProfile: () => api.get('/customers/profile'),
    updateProfile: (data) => api.put('/customers/profile', data),
    addAddress: (data) => api.post('/customers/addresses', data),
    googleLogin: (data) => api.post('/customers/google-login', data), // Madde 5
    sendOTP: () => api.post('/customers/send-otp'), // Madde 5
    verifyOTP: (code) => api.post('/customers/verify-otp', { code }), // Madde 5
    verifyPhoneFirebase: (firebaseIdToken) => api.post('/customers/verify-phone-firebase', { firebaseIdToken }),
    resendVerification: () => api.post('/customers/resend-verification'),
    forgotPassword: (email) => api.post('/customers/forgot-password', { email }),
    resetPassword: (token, newPassword) => api.post('/customers/reset-password', { token, newPassword }),
};

// ═══════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════
export const orderAPI = {
    create: (data) => apiV1.post('/orders', data),
    getMyOrders: () => apiV1.get('/orders/my-orders'),
    trackOrder: (orderNumber, email) => apiV1.get(`/orders/track?orderNumber=${orderNumber}&email=${email}`),
};

// ═══════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════
export const paymentAPI = {
    status: () => api.get('/payment/status'),
    initialize: (orderId) => apiV1.post('/checkout/initialize', { orderId }),
    verify: (paymentToken) => api.post('/payment/verify', { paymentToken }),
};

// ═══════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════
export const settingsAPI = {
    get: () => apiV1.get('/settings'),
};

// ═══════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════
export const favoritesAPI = {
    getAll: () => apiV1.get('/favorites'),
    add: (productId) => apiV1.post('/favorites/add', { productId }),
    remove: (productId) => apiV1.delete(`/favorites/remove/${productId}`),
};

// ═══════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════
export const couponAPI = {
    validate: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
};

// ═══════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════
export const newsletterAPI = {
    subscribe: (email) => apiV1.post('/newsletter', { email }),
};

export default api;

// ═══════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════
export const reviewAPI = {
    getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
    create: (productId, formData) => api.post(`/reviews/product/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ═══════════════════════════════════════
// RETURN / EXCHANGE
// ═══════════════════════════════════════
export const returnAPI = {
    create: (formData) => api.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    checkStatus: (orderNumber) => api.get(`/returns/status/${orderNumber}`),
    getMyReturns: () => api.get('/returns/my-returns'),
};
