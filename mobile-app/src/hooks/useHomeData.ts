import { useState, useEffect, useCallback } from 'react';
import { sourceApi } from '../services/api';
import { Book, BookWithStats } from '../types';
import { HERO_BOOKS, EDITORS_PICKS, RANKING_BOOKS } from '../data/mockData';

// 首页数据模式：backend = 从后端获取真实数据，mock = 使用本地 mock 数据
const HOME_DATA_MODE = process.env.EXPO_PUBLIC_HOME_DATA_MODE || 'backend';

// 首页各分区使用的搜索关键词
const HOME_KEYWORDS = {
    hero: '热门小说',
    editors_picks: '经典文学',
    rankings: '排行榜',
};

// 生成图片代理 URL
export const buildImageProxyUrl = (sourceId: string, imageUrl: string): string => {
    if (!sourceId || !imageUrl) return '';
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    return `${baseUrl}/proxy/audio?source=${encodeURIComponent(sourceId)}&url=${encodeURIComponent(imageUrl)}`;
};

// 将后端 Book 转换为 BookWithStats（用于 HeroCarousel）
const toBookWithStats = (book: Book, index: number): BookWithStats => ({
    ...book,
    id: typeof book.id === 'string' ? parseInt(book.id, 10) || index + 1 : book.id,
    created_at: book.created_at || new Date().toISOString(),
    updated_at: book.updated_at || new Date().toISOString(),
    stats: {
        playCount: book.play_count
            ? (book.play_count >= 10000 ? `${(book.play_count / 10000).toFixed(1)}万` : `${book.play_count}`)
            : '0',
        remainingTime: '听书中',
    },
});

// 将后端 Book 转换为排行榜格式
const toRankingBook = (book: Book, index: number): Book => ({
    ...book,
    id: typeof book.id === 'string' ? parseInt(book.id, 10) || index + 1 : book.id,
    rank: index + 1,
    created_at: book.created_at || new Date().toISOString(),
    updated_at: book.updated_at || new Date().toISOString(),
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

            // 并行请求三个分区的数据
            const [heroRes, editorsRes, rankingsRes] = await Promise.allSettled([
                sourceApi.globalSearch(HOME_KEYWORDS.hero),
                sourceApi.globalSearch(HOME_KEYWORDS.editors_picks),
                sourceApi.globalSearch(HOME_KEYWORDS.rankings),
            ]);

            // 处理轮播图数据
            if (heroRes.status === 'fulfilled' && heroRes.value.data?.results) {
                const books = heroRes.value.data.results.slice(0, 5).map(toBookWithStats);
                setHeroBooks(books.length > 0 ? books : HERO_BOOKS);
            } else {
                console.warn('Hero books fetch failed, using mock data');
                setHeroBooks(HERO_BOOKS);
            }

            // 处理编辑推荐数据
            if (editorsRes.status === 'fulfilled' && editorsRes.value.data?.results) {
                const books = editorsRes.value.data.results.slice(0, 6).map((book, i) => ({
                    ...book,
                    id: typeof book.id === 'string' ? parseInt(book.id, 10) || i + 1 : book.id,
                    created_at: book.created_at || new Date().toISOString(),
                    updated_at: book.updated_at || new Date().toISOString(),
                }));
                setEditorsPicks(books.length > 0 ? books : EDITORS_PICKS);
            } else {
                console.warn('Editors picks fetch failed, using mock data');
                setEditorsPicks(EDITORS_PICKS);
            }

            // 处理排行榜数据
            if (rankingsRes.status === 'fulfilled' && rankingsRes.value.data?.results) {
                const books = rankingsRes.value.data.results.slice(0, 5).map(toRankingBook);
                setRankingBooks(books.length > 0 ? books : RANKING_BOOKS);
            } else {
                console.warn('Rankings fetch failed, using mock data');
                setRankingBooks(RANKING_BOOKS);
            }

        } catch (err) {
            console.error('Failed to fetch home data:', err);
            setError('加载失败，使用离线数据');
            // 降级到 mock 数据
            setHeroBooks(HERO_BOOKS);
            setEditorsPicks(EDITORS_PICKS);
            setRankingBooks(RANKING_BOOKS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 使用 mock 数据
    const loadMockData = useCallback(() => {
        setHeroBooks(HERO_BOOKS);
        setEditorsPicks(EDITORS_PICKS);
        setRankingBooks(RANKING_BOOKS);
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
