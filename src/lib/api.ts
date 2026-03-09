import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

const api: AxiosInstance = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('maz_access');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

let refreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !orig._retry) {
      if (refreshing) return new Promise(r => queue.push(t => { orig.headers.Authorization = `Bearer ${t}`; r(api(orig)); }));
      orig._retry = true; refreshing = true;
      try {
        const refresh = localStorage.getItem('maz_refresh');
        if (!refresh) throw new Error('no token');
        const res = await axios.post(`${BASE}/auth/refresh`, { refreshToken: refresh });
        const { accessToken, refreshToken: nr } = res.data.data;
        localStorage.setItem('maz_access', accessToken);
        localStorage.setItem('maz_refresh', nr);
        queue.forEach(cb => cb(accessToken)); queue = [];
        orig.headers.Authorization = `Bearer ${accessToken}`;
        return api(orig);
      } catch {
        localStorage.clear();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
      } finally { refreshing = false; }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (d: { phone: string; password: string; role?: string; full_name?: string }) => api.post('/auth/register', d),
  login:    (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  refresh:  (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout:   (refreshToken: string) => api.post('/auth/logout',  { refreshToken }),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
};

export const usersAPI = {
  me:     () => api.get('/users/me'),
  update: (d: { full_name?: string; email?: string }) => api.patch('/users/me', d),
};

export const areasAPI = {
  list:   ()             => api.get('/areas'),
  detail: (slug: string) => api.get(`/areas/${slug}`),
};

export const amenitiesAPI = {
  list: () => api.get('/amenities'),
};

export const listingsAPI = {
  browse:   (params?: Record<string, any>) => api.get('/listings', { params }),
  featured: ()                             => api.get('/listings/featured'),
  detail:   (id: string)                  => api.get(`/listings/${id}`),
  report:   (id: string, reason: string, details?: string) =>
    api.post(`/listings/${id}/report`, { reason, details }),
};

export const reviewsAPI = {
  list:   (apartmentId: string, params?: Record<string, any>) => api.get(`/reviews/${apartmentId}`, { params }),
  submit: (apartmentId: string, rating: number, body?: string) =>
    api.post(`/reviews/${apartmentId}`, { rating, body }),
};

export const landlordAPI = {
  stats:              ()                               => api.get('/landlord/stats'),
  listings:           (params?: Record<string, any>)   => api.get('/landlord/listings', { params }),
  getListing:         (id: string)                     => api.get(`/landlord/listings/${id}`),
  createListing:      (d: Record<string, any>)         => api.post('/landlord/listings', d),
  updateListing:      (id: string, d: Record<string, any>) => api.patch(`/landlord/listings/${id}`, d),
  deleteListing:      (id: string)                     => api.delete(`/landlord/listings/${id}`),
  rentStatus:         (id: string, action: string)     => api.patch(`/landlord/listings/${id}/rent-status`, { action }),
  toggleAvailability: (id: string, is_available: boolean) =>
    api.patch(`/landlord/listings/${id}/availability`, { is_available }),
  uploadImages: (id: string, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    return api.post(`/landlord/listings/${id}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage:    (listingId: string, imgId: string) =>
    api.delete(`/landlord/listings/${listingId}/images/${imgId}`),
  setPrimaryImage:(listingId: string, imgId: string) =>
    api.patch(`/landlord/listings/${listingId}/images/${imgId}/primary`),
};

export const wishlistAPI = {
  list:   ()                   => api.get('/wishlist'),
  save:   (apartmentId: string)=> api.post(`/wishlist/${apartmentId}`),
  remove: (apartmentId: string)=> api.delete(`/wishlist/${apartmentId}`),
  check:  (apartmentId: string)=> api.get(`/wishlist/check/${apartmentId}`),
};

export const messagesAPI = {
  list:        ()                                         => api.get('/messages'),
  start:       (apartment_id: string, message: string)    => api.post('/messages', { apartment_id, message }),
  thread:      (inquiryId: string)                        => api.get(`/messages/${inquiryId}`),
  reply:       (inquiryId: string, message: string)       => api.post(`/messages/${inquiryId}/reply`, { message }),
  unreadCount: ()                                         => api.get('/messages/unread/count'),
};

export const adminAPI = {
  stats:            ()                                      => api.get('/admin/stats'),
  // listings
  listings:         (params?: Record<string,any>)           => api.get('/admin/listings', { params }),
  getListing:       (id: string)                            => api.get(`/admin/listings/${id}`),
  setListingStatus: (id: string, status: string, admin_note?: string) =>
    api.patch(`/admin/listings/${id}/status`, { status, admin_note }),
  setVerification:  (id: string, level: string)             => api.patch(`/admin/listings/${id}/verify`, { level }),
  setBoost:         (id: string, boosted: boolean, days?: number) =>
    api.patch(`/admin/listings/${id}/boost`, { boosted, days }),
  deleteListing:    (id: string)                            => api.delete(`/admin/listings/${id}`),
  // users
  users:            (params?: Record<string,any>)           => api.get('/admin/users', { params }),
  getUser:          (id: string)                            => api.get(`/admin/users/${id}`),
  setUserStatus:    (id: string, is_active: boolean)        => api.patch(`/admin/users/${id}/status`, { is_active }),
  setUserRole:      (id: string, role: string)              => api.patch(`/admin/users/${id}/role`, { role }),
  // reports
  reports:          (params?: Record<string,any>)           => api.get('/admin/reports', { params }),
  resolveReport:    (id: string)                            => api.patch(`/admin/reports/${id}/resolve`),
  // reviews
  deleteReview:     (id: string)                            => api.delete(`/admin/reviews/${id}`),
};

export const searchAPI = {
  search:  (params: Record<string,any>) => api.get('/search', { params }),
  suggest: (q: string)                  => api.get('/search/suggest', { params: { q } }),
};

export const paymentsAPI = {
  packages:  ()                                          => api.get('/payments/packages'),
  history:   ()                                          => api.get('/payments/history'),
  boost:     (d: { apartment_id: string; days: number; phone: string }) => api.post('/payments/boost', d),
  confirm:   (id: string, mpesa_code: string)            => api.post(`/payments/${id}/confirm`, { mpesa_code }),
  status:    (checkoutId: string)                        => api.get(`/payments/status/${checkoutId}`),
};

export const notificationsAPI = {
  list:      () => api.get('/notifications'),
  readAll:   () => api.patch('/notifications/read-all'),
  readOne:   (id: string) => api.patch(`/notifications/${id}/read`),
};
