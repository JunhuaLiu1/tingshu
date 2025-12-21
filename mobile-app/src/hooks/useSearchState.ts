import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'search_history';
const HOT_SEARCHES_KEY = 'hot_searches';

export interface SearchSuggestion {
  text: string;
  type: 'history' | 'hot' | 'suggestion';
}

export const useSearchState = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hotSearches, setHotSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 加载搜索历史
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 保存搜索历史
  const saveSearchHistory = async (query: string) => {
    try {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 20);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // 删除单个搜索历史
  const removeSearchHistory = async (query: string) => {
    try {
      const newHistory = searchHistory.filter(item => item !== query);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to remove search history:', error);
    }
  };

  // 清空搜索历史
  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  // 初始化热门搜索
  const initializeHotSearches = () => {
    const defaultHotSearches = [
      '三体',
      '百年孤独',
      '月亮与六便士',
      '活着',
      '围城',
      '白夜行',
      '追风筝的人',
      '挪威的森林',
      '解忧杂货店',
      '小王子'
    ];
    setHotSearches(defaultHotSearches);
  };

  // 生成搜索建议
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query.trim()) {
      return [
        ...hotSearches.slice(0, 5).map(text => ({ text, type: 'hot' as const })),
        ...searchHistory.slice(0, 3).map(text => ({ text, type: 'history' as const }))
      ];
    }

    const suggestions: SearchSuggestion[] = [];

    // 搜索历史匹配
    const historyMatches = searchHistory
      .filter(history => history.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(text => ({ text, type: 'history' as const }));

    suggestions.push(...historyMatches);

    // 热门搜索匹配
    const hotMatches = hotSearches
      .filter(hot => hot.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(text => ({ text, type: 'hot' as const }));

    suggestions.push(...hotMatches);

    // 如果建议不足，用热门搜索补充
    if (suggestions.length < 5) {
      const additional = hotSearches
        .filter(hot => !suggestions.some(s => s.text === hot))
        .slice(0, 5 - suggestions.length)
        .map(text => ({ text, type: 'hot' as const }));

      suggestions.push(...additional);
    }

    return suggestions.slice(0, 5);
  }, [hotSearches, searchHistory]);

  // 初始化
  useEffect(() => {
    loadSearchHistory();
    initializeHotSearches();
  }, []);

  return {
    searchHistory,
    hotSearches,
    suggestions,
    isLoadingHistory,
    saveSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
    generateSuggestions,
    loadSearchHistory
  };
};
