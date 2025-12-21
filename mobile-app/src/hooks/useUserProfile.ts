import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = 'user_profile';
const USER_STATS_KEY = 'user_stats';

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
  const getDefaultProfile = (): UserProfile => ({
    id: 1,
    username: 'booklover',
    email: 'booklover@example.com',
    avatar: 'https://picsum.photos/200/200?random=avatar',
    phone: '138****8888',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  });

  // 模拟统计数据（从 API 获取）
  const fetchStatsFromAPI = (): UserStats => {
    // 这里应该调用真实的 API
    // 暂时返回模拟数据
    return {
      booksPlayed: Math.floor(Math.random() * 200) + 50,  // 50-250
      totalHours: Math.floor(Math.random() * 1000) + 100, // 100-1100
      favorites: Math.floor(Math.random() * 50) + 10,     // 10-60
      downloads: Math.floor(Math.random() * 30) + 5,      // 5-35
      messages: Math.floor(Math.random() * 5),            // 0-5
      cacheSize: `${Math.floor(Math.random() * 200) + 50}MB`, // 50-250MB
    };
  };

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

      // 从 AsyncStorage 加载统计数据
      const statsData = await AsyncStorage.getItem(USER_STATS_KEY);
      let userStats: UserStats;

      if (statsData) {
        userStats = JSON.parse(statsData);
      } else {
        // 首次使用，从 API 获取（模拟）
        userStats = fetchStatsFromAPI();
        await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(userStats));
      }

      setStats(userStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载用户资料失败';
      setError(message);
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
