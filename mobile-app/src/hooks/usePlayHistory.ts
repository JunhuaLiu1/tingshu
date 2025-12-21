import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAY_HISTORY_KEY = 'play_history';

export interface PlayHistoryItem {
  id: string;
  bookId: number;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;      // 播放进度百分比 0-100
  duration: number;      // 总时长（秒）
  lastPlayed: Date;      // 最后播放时间
  episodeId?: number;    // 可选：集数ID
}

interface UsePlayHistoryReturn {
  history: PlayHistoryItem[];
  isLoading: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  saveHistory: (item: PlayHistoryItem) => Promise<void>;
  removeHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const usePlayHistory = (): UsePlayHistoryReturn => {
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载播放历史
  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const data = await AsyncStorage.getItem(PLAY_HISTORY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // 转换日期字符串回 Date 对象
        const items = parsed.map((item: any) => ({
          ...item,
          lastPlayed: new Date(item.lastPlayed)
        }));
        setHistory(items);
      } else {
        setHistory([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载历史记录失败';
      setError(message);
      console.error('Failed to load play history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存播放历史
  const saveHistory = useCallback(async (item: PlayHistoryItem) => {
    try {
      setError(null);

      // 先加载现有数据
      const data = await AsyncStorage.getItem(PLAY_HISTORY_KEY);
      let items: PlayHistoryItem[] = data ? JSON.parse(data) : [];

      // 检查是否已存在（更新进度和时间）
      const existingIndex = items.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...item,
          lastPlayed: new Date() // 更新为当前时间
        };
      } else {
        // 新增记录
        items.unshift({
          ...item,
          lastPlayed: new Date()
        });
      }

      // 限制最多保存 20 条
      items = items.slice(0, 20);

      // 保存到 AsyncStorage
      await AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(items));

      // 更新状态
      setHistory(items.map(i => ({
        ...i,
        lastPlayed: new Date(i.lastPlayed)
      })));
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存历史记录失败';
      setError(message);
      console.error('Failed to save play history:', err);
      throw err;
    }
  }, []);

  // 删除单条历史
  const removeHistory = useCallback(async (id: string) => {
    try {
      setError(null);

      const data = await AsyncStorage.getItem(PLAY_HISTORY_KEY);
      if (!data) return;

      let items: PlayHistoryItem[] = JSON.parse(data);
      items = items.filter(item => item.id !== id);

      await AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(items));

      setHistory(items.map(i => ({
        ...i,
        lastPlayed: new Date(i.lastPlayed)
      })));
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除记录失败';
      setError(message);
      console.error('Failed to remove play history:', err);
      throw err;
    }
  }, []);

  // 清空所有历史
  const clearHistory = useCallback(async () => {
    try {
      setError(null);
      await AsyncStorage.removeItem(PLAY_HISTORY_KEY);
      setHistory([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '清空历史记录失败';
      setError(message);
      console.error('Failed to clear play history:', err);
      throw err;
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    loadHistory,
    saveHistory,
    removeHistory,
    clearHistory
  };
};

export default usePlayHistory;
