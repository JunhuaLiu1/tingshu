import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, PaginatedResponse, Book, Category, Ranking, PlayHistory, SearchResult } from '../types';

function encodePathPreserveSlash(value: string): string {
  // encodeURIComponent 会把 "/" 编码成 "%2F"，但后端路由使用了 Gin 的通配符参数 *episodeId
  // 需要保留 "/" 作为路径分隔符，否则后端拿到的 episodeId 会被破坏
  return encodeURIComponent(value).replaceAll('%2F', '/');
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async config => {
    // 添加认证 token（如果有）
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  async error => {
    // 处理认证错误
    if (error.response?.status === 401) {
      // 清除 token
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { user_id: string; email: string; password: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/auth/register', data).then(res => res.data),

  login: (data: { identifier: string; password: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/auth/login', data).then(res => res.data),

  changePassword: (data: { old_password: string; new_password: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/auth/password/change', data).then(res => res.data),

  requestPasswordReset: (data: { email: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/auth/password/reset/request', data).then(res => res.data),

  confirmPasswordReset: (data: { email: string; code: string; password: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/auth/password/reset/confirm', data).then(res => res.data),
};

// 书籍 API
export const bookApi = {
  // 获取书籍列表
  getBooks: (page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Book>>> =>
    apiClient.get(`/books?page=${page}&limit=${limit}`).then(res => res.data),

  // 获取书籍详情
  getBookById: (id: number): Promise<ApiResponse<Book>> =>
    apiClient.get(`/books/${id}`).then(res => res.data),

  // 获取书籍剧集
  getBookEpisodes: (bookId: number): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/books/${bookId}/episodes`).then(res => res.data),
};

// 分类 API
export const categoryApi = {
  // 获取所有分类
  getCategories: (): Promise<ApiResponse<Category[]>> =>
    apiClient.get('/categories').then(res => res.data),
};

// 排行榜 API
export const rankingApi = {
  // 获取默认排行榜
  getRankings: (): Promise<ApiResponse<Ranking[]>> =>
    apiClient.get('/rankings').then(res => res.data),

  // 获取指定时期排行榜
  getRankingsByPeriod: (period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse<Ranking[]>> =>
    apiClient.get(`/rankings/${period}`).then(res => res.data),
};

// 搜索 API
export const searchApi = {
  // 搜索书籍
  searchBooks: (keyword: string): Promise<ApiResponse<Book[]>> =>
    apiClient.get(`/search?q=${encodeURIComponent(keyword)}`).then(res => res.data),
};

// 音源 API
export const sourceApi = {
  // 获取所有音源列表
  getSources: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/sources').then(res => res.data),

  // 全局搜索（聚合所有音源）
  globalSearch: (keyword: string): Promise<ApiResponse<{ total: number; results: any[] }>> =>
    apiClient.post(`/global/search?q=${encodeURIComponent(keyword)}`, null, { timeout: 20000 }).then(res => res.data),

  // 搜索指定音源
  searchSource: (sourceId: string, keyword: string, page: number = 1): Promise<ApiResponse<SearchResult>> =>
    apiClient
      .get(`/sources/${sourceId}/search?q=${encodeURIComponent(keyword)}&page=${page}`, { timeout: 20000 })
      .then(res => res.data),

  // 获取音源书籍详情
  getSourceBookDetail: (sourceId: string, bookId: string): Promise<ApiResponse<Book>> =>
    apiClient.get(`/sources/${sourceId}/books/${encodeURIComponent(bookId)}`).then(res => res.data),

  // 获取音频地址
  getSourceAudio: (sourceId: string, episodeId: string): Promise<ApiResponse<{ audio_url: string; audio_proxy_url?: string }>> =>
    apiClient.get(`/sources/${sourceId}/audio/${encodePathPreserveSlash(episodeId)}`).then(res => res.data),
};

// 播放进度 API
export const playbackApi = {
  // 保存播放进度
  saveProgress: (data: { book_id: string; episode_id: string; position: number; duration: number }): Promise<ApiResponse<{ saved: boolean }>> =>
    apiClient.post('/playback/progress', data).then(res => res.data),

  // 获取播放进度
  getProgress: (bookId: string, episodeId?: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/playback/progress?book_id=${bookId}${episodeId ? `&episode_id=${episodeId}` : ''}`).then(res => res.data),
};

// 播放历史 API
export const historyApi = {
  // 保存播放历史
  saveHistory: (data: {
    source_id?: string;
    book_id: string;
    title: string;
    author: string;
    cover_url: string;
    episode_id?: string;
    episode_title?: string;
    progress: number;
    duration: number;
  }): Promise<ApiResponse<any>> =>
    apiClient.post('/history', data).then(res => res.data),

  // 获取播放历史列表
  getHistory: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/history').then(res => res.data),

  // 删除单条历史
  deleteHistory: (id: string): Promise<ApiResponse<any>> =>
    apiClient.delete(`/history/${id}`).then(res => res.data),

  // 清空所有历史
  clearHistory: (): Promise<ApiResponse<any>> =>
    apiClient.delete('/history').then(res => res.data),
};

// 用户 API
export const userApi = {
  // 获取当前用户资料
  getProfile: (): Promise<ApiResponse<any>> =>
    apiClient.get('/profile').then(res => res.data),

  // 更新当前用户资料
  updateProfile: (data: { avatar?: string }): Promise<ApiResponse<any>> =>
    apiClient.put('/profile', data).then(res => res.data),

  // 获取用户档案（旧接口，保留兼容）
  getUserProfile: (userId: number): Promise<ApiResponse<any>> =>
    apiClient.get(`/users/${userId}/profile`).then(res => res.data),

  // 更新用户档案（旧接口，保留兼容）
  updateUserProfile: (userId: number, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/users/${userId}/profile`, data).then(res => res.data),

  // 获取播放历史
  getUserHistory: (userId: number): Promise<ApiResponse<PlayHistory[]>> =>
    apiClient.get(`/users/${userId}/history`).then(res => res.data),

  // 更新播放历史
  updateUserHistory: (userId: number, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/users/${userId}/history`, data).then(res => res.data),
};

// 健康检查
export const healthApi = {
  check: (): Promise<ApiResponse<{ status: string; message: string }>> =>
    apiClient.get('/health').then(res => res.data),
};

export default apiClient;
