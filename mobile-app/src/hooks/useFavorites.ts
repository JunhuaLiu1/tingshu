import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorites';

export interface FavoriteItem {
  id: string; // `${sourceId}_${bookId}`
  sourceId: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  addedAt: number;
}

export type FavoriteInput = Omit<FavoriteItem, 'id' | 'addedAt'>;

function makeFavoriteId(sourceId: string | undefined, bookId: string | number): string {
  const src = sourceId && sourceId.length > 0 ? sourceId : 'local';
  return `${src}_${String(bookId)}`;
}

async function readFavorites(): Promise<FavoriteItem[]> {
  const data = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!data) return [];
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(Boolean);
}

async function writeFavorites(items: FavoriteItem[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

export async function saveFavoriteItem(input: FavoriteInput): Promise<{ isNowFavorite: boolean }> {
  const id = makeFavoriteId(input.sourceId, input.bookId);
  const items = await readFavorites();
  const exists = items.some(i => i?.id === id);

  if (exists) {
    const next = items.filter(i => i?.id !== id);
    await writeFavorites(next);
    return { isNowFavorite: false };
  }

  const next: FavoriteItem[] = [
    {
      id,
      sourceId: input.sourceId || 'local',
      bookId: String(input.bookId),
      title: input.title,
      author: input.author,
      coverUrl: input.coverUrl,
      addedAt: Date.now(),
    },
    ...items,
  ];

  // 限制数量，避免无限增长
  await writeFavorites(next.slice(0, 200));
  return { isNowFavorite: true };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await readFavorites();
      setFavorites(items);
    } catch (e) {
      console.error('Failed to load favorites:', e);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorited = useCallback(
    (sourceId: string | undefined, bookId: string | number): boolean => {
      const id = makeFavoriteId(sourceId, bookId);
      return favorites.some(f => f.id === id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(async (input: FavoriteInput) => {
    const result = await saveFavoriteItem(input);
    await loadFavorites();
    return result;
  }, [loadFavorites]);

  const count = useMemo(() => favorites.length, [favorites.length]);

  return {
    favorites,
    count,
    isLoading,
    loadFavorites,
    isFavorited,
    toggleFavorite,
  };
}

