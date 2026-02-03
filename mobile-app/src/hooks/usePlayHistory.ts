import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { historyApi } from '../services/api';

const PLAY_HISTORY_KEY = 'play_history';

export interface PlayHistoryItem {
  id: string;
  bookId: number | string;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;      // 播放进度百分比 0-100
  duration: number;      // 总时长（秒）
  lastPlayed: Date;      // 最后播放时间
  episodeId?: number | string;    // 可选：集数ID
  episodeTitle?: string;
  sourceId?: string;
}

const normalizeText = (value?: string): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeSourceId = (value?: string): string => {
  const v = (value ?? '').trim();
  return v ? v : 'local';
};

const computeStorageId = (item: Pick<PlayHistoryItem, 'sourceId' | 'bookId'>): string =>
  `${normalizeSourceId(item.sourceId)}_${String(item.bookId)}`;

// 用于“同一本书”的去重：尽量与用户看到的内容一致（标题/作者），避免跨音源出现重复书籍
const computeBookIdentityKey = (item: Pick<PlayHistoryItem, 'title' | 'author' | 'sourceId' | 'bookId'>): string => {
  const title = normalizeText(item.title);
  const author = normalizeText(item.author);
  if (title) return author ? `${title}|${author}` : title;
  // 兜底：没有标题时按 source+bookId 去重
  return computeStorageId(item);
};

const normalizeAndDedupHistory = (raw: any[]): { items: PlayHistoryItem[]; changed: boolean } => {
  let changed = false;

  const parsed: PlayHistoryItem[] = (raw || [])
    .filter(Boolean)
    .map((item: any) => {
      const lastPlayed = item?.lastPlayed ? new Date(item.lastPlayed) : new Date();
      if (!(lastPlayed instanceof Date) || Number.isNaN(lastPlayed.getTime())) {
        changed = true;
      }

      const normalized: PlayHistoryItem = {
        ...item,
        bookId: item?.bookId ?? item?.book_id,
        coverUrl: item?.coverUrl ?? item?.cover_url ?? '',
        lastPlayed: Number.isNaN(lastPlayed.getTime()) ? new Date() : lastPlayed,
      };

      if (!normalized.id) {
        normalized.id = computeStorageId(normalized);
        changed = true;
      }

      return normalized;
    })
    .filter(i => i.bookId !== undefined && i.bookId !== null);

  // 按时间从新到旧排序，保证去重后保留“最近一次”
  parsed.sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());

  const seen = new Set<string>();
  const deduped: PlayHistoryItem[] = [];
  for (const item of parsed) {
    const key = computeBookIdentityKey(item);
    if (seen.has(key)) {
      changed = true;
      continue;
    }
    seen.add(key);

    // 同步修正 id（防止历史数据曾用 episode 维度等导致同书多条）
    const expectedId = computeStorageId(item);
    if (item.id !== expectedId) {
      item.id = expectedId;
      changed = true;
    }

    deduped.push(item);
  }

  if (deduped.length > 50) {
    changed = true;
  }

  return { items: deduped.slice(0, 50), changed };
};

// Standalone function to save play history (can be called from anywhere)
export const savePlayHistoryItem = async (item: Omit<PlayHistoryItem, 'lastPlayed'>): Promise<void> => {
  try {
    // Save to local AsyncStorage
    const data = await AsyncStorage.getItem(PLAY_HISTORY_KEY);
    const existingRaw: any[] = data ? JSON.parse(data) : [];
    const { items: existingItems } = normalizeAndDedupHistory(existingRaw);

    const record: PlayHistoryItem = {
      ...item,
      id: computeStorageId(item),
      lastPlayed: new Date(),
    };

    const newKey = computeBookIdentityKey(record);
    const merged = [record, ...existingItems.filter(i => computeBookIdentityKey(i) !== newKey)];
    const { items: finalItems } = normalizeAndDedupHistory(merged);

    await AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(finalItems));

    // Sync to backend database
    try {
      await historyApi.saveHistory({
        source_id: item.sourceId,
        book_id: String(item.bookId),
        title: item.title,
        author: item.author,
        cover_url: item.coverUrl,
        episode_id: item.episodeId ? String(item.episodeId) : undefined,
        episode_title: item.episodeTitle,
        progress: item.progress,
        duration: item.duration,
      });
    } catch (apiErr) {
      // Don't fail if API sync fails, local storage is already updated
      console.warn('Failed to sync history to backend:', apiErr);
    }
  } catch (err) {
    console.error('Failed to save play history:', err);
  }
};

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
        const { items, changed } = normalizeAndDedupHistory(parsed);
        setHistory(items);
        // 若发现旧数据不规范或存在重复，顺手做一次“迁移清理”，避免历史页再次出现重复
        if (changed) {
          await AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(items));
        }
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
      const existingRaw: any[] = data ? JSON.parse(data) : [];
      const { items: existingItems } = normalizeAndDedupHistory(existingRaw);

      const record: PlayHistoryItem = {
        ...item,
        id: computeStorageId(item),
        lastPlayed: new Date(),
      };

      const newKey = computeBookIdentityKey(record);
      const merged = [record, ...existingItems.filter(i => computeBookIdentityKey(i) !== newKey)];
      const { items: items } = normalizeAndDedupHistory(merged);

      // 保存到 AsyncStorage
      await AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(items));

      // 更新状态
      setHistory(items);
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

      const parsed = JSON.parse(data);
      const { items: items } = normalizeAndDedupHistory(parsed);
      const next = items.filter(item => item.id !== id);

      await AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
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
