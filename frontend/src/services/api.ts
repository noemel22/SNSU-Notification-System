import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Build a full URL for a media path like "media/123"
// Always uses relative paths since frontend and backend share the same origin
export const getMediaUrl = (mediaPath: string | undefined | null): string => {
  if (!mediaPath) return '';
  // If it's already a full URL, return as-is
  if (mediaPath.startsWith('http')) return mediaPath;
  // New format: media/{id} → /api/media/{id}
  if (mediaPath.startsWith('media/')) return `/api/${mediaPath}`;
  // Legacy format: uploads/profiles/... or profiles/...
  return `/${mediaPath}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  register: (data: any) =>
    api.post('/auth/register', data),

  logout: () =>
    api.post('/auth/logout')
};

export const userService = {
  getUsers: () =>
    api.get('/users'),

  getAllUsers: () =>
    api.get('/users'),

  getUserById: (id: number) =>
    api.get(`/users/${id}`),

  createUser: (data: any) =>
    api.post('/users', data),

  updateUser: (id: number, data: any) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),

  updateProfile: (data: any) =>
    api.put('/users/profile/update', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  changePassword: (data: any) =>
    api.post('/users/profile/password', data),

  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const notificationService = {
  getNotifications: () =>
    api.get('/notifications'),

  getNotificationById: (id: number) =>
    api.get(`/notifications/${id}`),

  createNotification: (formData: any) => {
    return api.post('/notifications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateNotification: (id: number, formData: any) => {
    return api.put(`/notifications/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteNotification: (id: number) =>
    api.delete(`/notifications/${id}`)
};

export const messageService = {
  getMessages: (userId?: number) =>
    userId ? api.get(`/messages/${userId}`) : api.get('/messages'),

  getConversations: () =>
    api.get('/messages/conversations'),

  sendMessage: (data: any) =>
    api.post('/messages', data),

  markAsRead: (messageId: number) =>
    api.put(`/messages/${messageId}/read`),

  deleteMessageForMe: (messageId: number) =>
    api.delete(`/messages/${messageId}/delete-for-me`),

  deleteMessageForEveryone: (messageId: number) =>
    api.delete(`/messages/${messageId}/delete-for-everyone`)
};

export const classService = {
  getClasses: () =>
    api.get('/classes'),

  getClassById: (id: number) =>
    api.get(`/classes/${id}`),

  createClass: (data: any) =>
    api.post('/classes', data),

  updateClass: (id: number, data: any) =>
    api.put(`/classes/${id}`, data),

  deleteClass: (id: number) =>
    api.delete(`/classes/${id}`)
};

export default api;
