// 数据类型定义（合并现有 React 代码）

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// 分类模型
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 书籍模型（支持两种 ID 格式）
export interface Book {
  id: number | string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string; // 后端格式
  coverUrl?: string; // 前端格式
  audio_url?: string;
  audioUrl?: string;
  duration?: number; // 可选：总时长（秒）
  play_count?: number; // 后端格式
  playCount?: string; // 前端格式：显示用
  source_id?: string; // 后端格式
  sourceId?: string; // 前端格式
  category_id?: number;
  category?: string; // 前端格式：分类名称
  episodes?: Episode[];
  created_at: string;
  updated_at: string;
  rank?: number; // 排行榜位置
}

export interface Episode {
  id: number;
  book_id: number;
  title: string;
  audio_url: string;
  duration: number;
  episode_num: number;
  play_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlayHistory {
  id: number;
  user_id: number;
  book_id: number;
  episode_id?: number;
  progress: number;
  duration: number;
  is_completed: boolean;
  last_position: number;
  created_at: string;
  updated_at: string;
}

export interface Ranking {
  id: number;
  book_id: number;
  rank: number;
  score: number;
  period: string; // daily, weekly, monthly
  date: string;
  created_at: string;
  updated_at: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 播放器状态类型
export interface PlayerState {
  isPlaying: boolean;
  currentBook: Book | null;
  currentEpisode: Episode | null;
  progress: number;
  duration: number;
  playbackRate: number;
}

// 搜索结果类型
export interface SearchResult {
  books: Book[];
  total?: number;
  total_page?: number;
  current_page?: number;
}

// 导航类型
export type RootStackParamList = {
  Main: undefined;
  BookDetail: { bookId: number };
  Player: { bookId: number; episodeId?: number; progress?: number };
  ProfileEdit: undefined;
  Favorites: undefined;
  Downloads: undefined;
  Feedback: undefined;
  Help: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Player: undefined;
  History: undefined;
  Profile: undefined;
};

// 统计信息接口（用于 HeroCarousel 等组件）
export interface BookStats {
  playCount: string; // 显示格式：'1.2k'
  remainingTime: string; // 显示格式：'45m left'
  actualPlayCount?: number; // 实际数值
  actualRemainingTime?: number; // 实际秒数
}

// 扩展 Book 接口以支持统计信息
export interface BookWithStats extends Book {
  stats?: BookStats;
}

// 分类图标映射类型
export type CategoryIconMap = Record<number, string>;
