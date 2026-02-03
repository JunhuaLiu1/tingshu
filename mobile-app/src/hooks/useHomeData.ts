import { useState, useEffect, useCallback } from 'react';
import { sourceApi } from '../services/api';
import { Book, BookWithStats } from '../types';
import { HERO_BOOKS, EDITORS_PICKS, RANKING_BOOKS } from '../data/mockData';
import { prioritizeForeignAndClassics } from '../utils/homeRecommend';

// 首页数据模式：backend = 从后端获取真实数据，mock = 使用本地 mock 数据
const HOME_DATA_MODE = process.env.EXPO_PUBLIC_HOME_DATA_MODE || 'backend';

const SECTION_LIMITS = {
    hero: 3,
    editors_picks: 6,
    rankings: 10,
} as const;

// 首页各分区使用的搜索关键词（按优先级顺序）
const HOME_KEYWORDS: Record<keyof typeof SECTION_LIMITS, string[]> = {
    hero: ['世界名著', '外国文学', '经典小说', '名著', '经典文学'],
    editors_picks: ['世界名著', '外国小说', '经典文学', '名著', '文学经典'],
    rankings: ['世界名著', '经典小说', '外国文学', '名著', '经典'],
};

// 生成图片代理 URL
export const buildImageProxyUrl = (sourceId: string, imageUrl: string): string => {
    if (!sourceId || !imageUrl) return '';
    const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');
    return `${baseUrl}/proxy/audio?source=${encodeURIComponent(sourceId)}&url=${encodeURIComponent(imageUrl)}`;
};

const getBookKey = (book: Book): string => {
    const id = String(book.id ?? '').trim();
    const sourceId = String(book.source_id || book.sourceId || '').trim();
    if (!id || !sourceId) return '';
    return `${sourceId}:${id}`;
};

const withTimestamps = (book: Book): Book => ({
    ...book,
    created_at: book.created_at || new Date().toISOString(),
    updated_at: book.updated_at || new Date().toISOString(),
});

const sortByPlayCountDesc = (books: Book[]): Book[] => {
    return [...books].sort((a, b) => (Number(b.play_count || 0) - Number(a.play_count || 0)));
};

// 将后端 Book 转换为 BookWithStats（用于 HeroCarousel）
const toBookWithStats = (book: Book): BookWithStats => ({
    ...withTimestamps(book),
    // 保留音源返回的原始 id（常为字符串且非纯数字）；强转会导致后续无法按 id 获取详情/章节
    id: book.id,
    stats: {
        playCount: book.play_count
            ? (book.play_count >= 10000 ? `${(book.play_count / 10000).toFixed(1)}万` : `${book.play_count}`)
            : '0',
        remainingTime: '听书中',
    },
});

// 将后端 Book 转换为排行榜格式
const toRankingBook = (book: Book, index: number): Book => ({
    ...withTimestamps(book),
    id: book.id,
    rank: index + 1,
});

interface UseHomeDataReturn {
    heroBooks: BookWithStats[];
    editorsPicks: Book[];
    rankingBooks: Book[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    dataMode: string;
}

/**
 * 首页数据 Hook
 * 根据环境变量决定使用后端数据或 mock 数据
 */
export const useHomeData = (): UseHomeDataReturn => {
    const [heroBooks, setHeroBooks] = useState<BookWithStats[]>([]);
    const [editorsPicks, setEditorsPicks] = useState<Book[]>([]);
    const [rankingBooks, setRankingBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 从后端获取数据
    const fetchFromBackend = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const usedKeys = new Set<string>();

            const collectSection = async (section: keyof typeof SECTION_LIMITS): Promise<Book[]> => {
                const collected: Book[] = [];
                for (const keyword of HOME_KEYWORDS[section]) {
                    if (collected.length >= SECTION_LIMITS[section]) break;
                    let results: Book[] = [];
                    try {
                        const res = await sourceApi.globalSearch(keyword);
                        results = res.data?.results || [];
                    } catch {
                        if (__DEV__) {
                            console.log(`[useHomeData] globalSearch failed: section=${section}, keyword=${keyword}`);
                        }
                        continue;
                    }

                    const prioritized = prioritizeForeignAndClassics(sortByPlayCountDesc(results));
                    for (const book of prioritized) {
                        if (collected.length >= SECTION_LIMITS[section]) break;
                        const key = getBookKey(book);
                        if (!key || usedKeys.has(key)) continue;
                        usedKeys.add(key);
                        collected.push(withTimestamps(book));
                    }
                }
                return collected;
            };

            const [heroRaw, editorsRaw, rankingsRaw] = await Promise.all([
                collectSection('hero'),
                collectSection('editors_picks'),
                collectSection('rankings'),
            ]);

            const hero = heroRaw.map((b) => toBookWithStats(b));
            const editors = editorsRaw.map((book) => ({
                ...withTimestamps(book),
                id: book.id,
            }));
            const rankings = rankingsRaw.map((b, i) => toRankingBook(b, i));

            const anyBackendData = hero.length > 0 || editors.length > 0 || rankings.length > 0;

            if (!anyBackendData) {
                setError('首页数据加载失败，已降级为离线数据');
            }

            setHeroBooks(hero.length > 0 ? hero : HERO_BOOKS.slice(0, SECTION_LIMITS.hero));
            setEditorsPicks(editors.length > 0 ? editors : EDITORS_PICKS.slice(0, SECTION_LIMITS.editors_picks));
            setRankingBooks(rankings.length > 0 ? rankings : RANKING_BOOKS.slice(0, SECTION_LIMITS.rankings));

        } catch (err) {
            console.error('Failed to fetch home data:', err);
            setError('加载失败，使用离线数据');
            // 降级到 mock 数据
            setHeroBooks(HERO_BOOKS.slice(0, SECTION_LIMITS.hero));
            setEditorsPicks(EDITORS_PICKS.slice(0, SECTION_LIMITS.editors_picks));
            setRankingBooks(RANKING_BOOKS.slice(0, SECTION_LIMITS.rankings));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 使用 mock 数据
    const loadMockData = useCallback(() => {
        setHeroBooks(HERO_BOOKS.slice(0, SECTION_LIMITS.hero));
        setEditorsPicks(EDITORS_PICKS.slice(0, SECTION_LIMITS.editors_picks));
        setRankingBooks(RANKING_BOOKS.slice(0, SECTION_LIMITS.rankings));
        setIsLoading(false);
    }, []);

    // 刷新数据
    const refresh = useCallback(async () => {
        if (HOME_DATA_MODE === 'mock') {
            loadMockData();
        } else {
            await fetchFromBackend();
        }
    }, [fetchFromBackend, loadMockData]);

    // 初始加载
    useEffect(() => {
        if (HOME_DATA_MODE === 'mock') {
            console.log('Home data mode: mock');
            loadMockData();
        } else {
            console.log('Home data mode: backend');
            fetchFromBackend();
        }
    }, [fetchFromBackend, loadMockData]);

    return {
        heroBooks,
        editorsPicks,
        rankingBooks,
        isLoading,
        error,
        refresh,
        dataMode: HOME_DATA_MODE,
    };
};
