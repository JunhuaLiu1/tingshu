import axios, {AxiosResponse} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiResponse, PaginatedResponse, Book, Category, Ranking, PlayHistory, SearchResult} from '../types';

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
  // 搜索指定音源
  searchSource: (sourceId: string, keyword: string, page: number = 1): Promise<ApiResponse<SearchResult>> =>
    apiClient.get(`/sources/${sourceId}/search?q=${encodeURIComponent(keyword)}&page=${page}`).then(res => res.data),

  // 获取音源书籍详情
  getSourceBookDetail: (sourceId: string, bookId: string): Promise<ApiResponse<Book>> =>
    apiClient.get(`/sources/${sourceId}/books/${encodeURIComponent(bookId)}`).then(res => res.data),

  // 获取音频地址
  getSourceAudio: (sourceId: string, episodeId: string): Promise<ApiResponse<{audio_url: string; audio_proxy_url?: string}>> =>
    apiClient.get(`/sources/${sourceId}/audio/${encodeURIComponent(episodeId)}`).then(res => res.data),
};

// 播放进度 API
export const playbackApi = {
  // 保存播放进度
  saveProgress: (data: { book_id: string; episode_id: string; position: number; duration: number }): Promise<ApiResponse<{saved: boolean}>> =>
    apiClient.post('/playback/progress', data).then(res => res.data),

  // 获取播放进度
  getProgress: (bookId: string, episodeId?: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/playback/progress?book_id=${bookId}${episodeId ? `&episode_id=${episodeId}` : ''}`).then(res => res.data),
};

// 用户 API（预留）
export const userApi = {
  // 获取用户档案
  getUserProfile: (userId: number): Promise<ApiResponse<any>> =>
    apiClient.get(`/users/${userId}/profile`).then(res => res.data),

  // 更新用户档案
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
  check: (): Promise<ApiResponse<{status: string; message: string}>> =>
    apiClient.get('/health').then(res => res.data),
};

export default apiClient;
