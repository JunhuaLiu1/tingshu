import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { historyApi } from '../services/api';
import { audioCache } from '../services/audioCache';

const USER_PROFILE_KEY = 'user_profile';
const USER_STATS_KEY = 'user_stats';
const PLAY_HISTORY_KEY = 'play_history';
const FAVORITES_KEY = 'favorites';
const PROGRESS_KEY_PREFIX = 'playback_progress_';

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

// 用户基本信息接口
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// 用户统计数据接口
export interface UserStats {
  booksPlayed: number;      // 已听书籍
  totalHours: number;       // 总时长(小时)
  favorites: number;        // 收藏数量
  downloads: number;        // 下载数量
  messages: number;         // 新消息数
  cacheSize: string;        // 缓存大小
}

// Hook 返回类型
interface UseUserProfileReturn {
  profile: UserProfile | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  updateStats: (data: Partial<UserStats>) => Promise<UserStats>;
}

/**
 * 用户资料 Hook
 * 管理用户信息、统计数据和持久化存储
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模拟默认用户数据（用于首次使用）
  const getDefaultProfile = useCallback((): UserProfile => ({
    id: 1,
    username: 'booklover',
    email: 'booklover@example.com',
    avatar: 'https://picsum.photos/200/200?random=avatar',
    phone: '138****8888',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  }), []);

  const loadFavoritesCount = useCallback(async (): Promise<number> => {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      if (!data) return 0;
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return 0;
      return parsed.length;
    } catch {
      return 0;
    }
  }, []);

  const computeStatsFromLocalHistory = useCallback(async (): Promise<{ booksPlayed: number; listenedSeconds: number }> => {
    try {
      const data = await AsyncStorage.getItem(PLAY_HISTORY_KEY);
      if (!data) return { booksPlayed: 0, listenedSeconds: 0 };
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return { booksPlayed: 0, listenedSeconds: 0 };

      const uniqueBookKeys = new Set<string>();
      let listenedSeconds = 0;

      for (const item of parsed) {
        const bookId = (item?.bookId ?? item?.book_id ?? '').toString();
        const sourceId = (item?.sourceId ?? item?.source_id ?? 'local').toString();
        if (bookId) uniqueBookKeys.add(`${sourceId}_${bookId}`);

        const duration = safeNumber(item?.duration);
        const progress = safeNumber(item?.progress);
        if (duration > 0 && progress > 0) {
          listenedSeconds += (duration * progress) / 100;
        }
      }

      return { booksPlayed: uniqueBookKeys.size, listenedSeconds };
    } catch {
      return { booksPlayed: 0, listenedSeconds: 0 };
    }
  }, []);

  const computeListenedSecondsFromProgressKeys = useCallback(async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(k => typeof k === 'string' && k.startsWith(PROGRESS_KEY_PREFIX));
      if (progressKeys.length === 0) return 0;

      let total = 0;
      const chunkSize = 50;
      for (let i = 0; i < progressKeys.length; i += chunkSize) {
        const chunk = progressKeys.slice(i, i + chunkSize);
        const pairs = await AsyncStorage.multiGet(chunk);
        for (const [, value] of pairs) {
          if (!value) continue;
          try {
            const parsed = JSON.parse(value);
            total += safeNumber(parsed?.position);
          } catch {
            // ignore malformed record
          }
        }
      }

      return total;
    } catch {
      return 0;
    }
  }, []);

  // 基于真实数据计算统计：优先后端 /history（登录态），失败时回退本地 play_history
  const fetchStats = useCallback(async (): Promise<UserStats> => {
    let booksPlayed = 0;
    let listenedSeconds = 0;

    // 1) 听书时长：优先使用本地按章节保存的播放进度（每 5 秒更新一次），更贴近真实使用情况
    listenedSeconds = await computeListenedSecondsFromProgressKeys();

    try {
      const resp = await historyApi.getHistory();
      if (resp.code === 200 && Array.isArray(resp.data)) {
        booksPlayed = resp.data.length;
        // 若本地没有可用进度数据，则使用历史记录做近似
        if (listenedSeconds <= 0) {
          listenedSeconds = resp.data.reduce((sum: number, h: any) => {
            const duration = safeNumber(h?.duration);
            const progress = safeNumber(h?.progress);
            if (duration <= 0 || progress <= 0) return sum;
            return sum + (duration * progress) / 100;
          }, 0);
        }
      } else {
        const local = await computeStatsFromLocalHistory();
        booksPlayed = local.booksPlayed;
        if (listenedSeconds <= 0) listenedSeconds = local.listenedSeconds;
      }
    } catch {
      const local = await computeStatsFromLocalHistory();
      booksPlayed = local.booksPlayed;
      if (listenedSeconds <= 0) listenedSeconds = local.listenedSeconds;
    }

    const favorites = await loadFavoritesCount();
    const cachedCount = await audioCache.getCacheSize();

    return {
      booksPlayed,
      totalHours: listenedSeconds / 3600,
      favorites,
      downloads: cachedCount,
      messages: 0,
      cacheSize: `${cachedCount}个音频`,
    };
  }, [computeListenedSecondsFromProgressKeys, computeStatsFromLocalHistory, loadFavoritesCount]);

  // 加载用户资料
  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // 从 AsyncStorage 加载用户资料
      const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
      let userProfile: UserProfile;

      if (profileData) {
        userProfile = JSON.parse(profileData);
      } else {
        // 首次使用，创建默认资料
        userProfile = getDefaultProfile();
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      }

      setProfile(userProfile);

      const userStats = await fetchStats();
      setStats(userStats);
      // 允许离线显示最近一次统计
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(userStats));
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载用户资料失败';
      setError(message);
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats, getDefaultProfile]);

  // 更新用户资料
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    try {
      setError(null);

      if (!profile) {
        throw new Error('用户资料未加载');
      }

      const updatedProfile = {
        ...profile,
        ...data,
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      return updatedProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新用户资料失败';
      setError(message);
      console.error('Failed to update user profile:', err);
      throw err;
    }
  }, [profile]);

  // 更新统计数据
  const updateStats = useCallback(async (data: Partial<UserStats>) => {
    try {
      setError(null);

      if (!stats) {
        throw new Error('统计数据未加载');
      }

      const updatedStats = {
        ...stats,
        ...data,
      };

      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(updatedStats));
      setStats(updatedStats);

      return updatedStats;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新统计数据失败';
      setError(message);
      console.error('Failed to update user stats:', err);
      throw err;
    }
  }, [stats]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    stats,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    updateStats,
  };
};
