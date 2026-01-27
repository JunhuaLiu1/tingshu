import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  InteractionManager,
  SectionList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Book } from '../types';
import { sourceApi } from '../services/api';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import CachedImage from '../components/common/CachedImage';
import Loading from '../components/common/Loading';
import { useToast } from '../contexts/ToastContext';
import { useSearchState } from '../hooks/useSearchState';
import SearchSuggestions from '../components/SearchSuggestions';
import { router } from 'expo-router';

const ITEM_HEIGHT = 140;
const MAX_ITEMS_PER_SOURCE = 5;

// 音源名称映射
const SOURCE_NAMES: Record<string, string> = {
  ximalaya: '喜马拉雅',
  kuwo: '酷我听书',
  huanting: '一夜听书',
  shuyinfm: '书音FM',
  ting78: '七八听书',
  tingsm: '听书迷',
  leting8: '乐听吧',
  missevan: '猫耳FM',
};
const SOURCE_ORDER = [
  'ximalaya',
  ...Object.keys(SOURCE_NAMES).filter((id) => id !== 'ximalaya'),
];

const getPlayCount = (item: Book) => {
  if (typeof item.play_count === 'number') return item.play_count;
  if (typeof item.playCount === 'string') {
    const parsed = parseInt(item.playCount, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

interface GroupedResult {
  sourceId: string;
  sourceName: string;
  books: Book[];
  hasMore: boolean;
}

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'global' | 'single'>('global');
  const [selectedSource, setSelectedSource] = useState<string>('ximalaya');
  const [currentPage, setCurrentPage] = useState(1);

  const searchInputRef = useRef<TextInput>(null);
  const { showToast } = useToast();

  const {
    saveSearchHistory,
    clearSearchHistory,
    generateSuggestions,
  } = useSearchState();

  useEffect(() => {
    const timeout = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        searchInputRef.current?.focus();
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const localSuggestions = useMemo(
    () => generateSuggestions(searchQuery),
    [searchQuery, generateSuggestions]
  );

  // 全局搜索
  const handleGlobalSearch = useCallback(async () => {
    setError(null);
    if (!searchQuery.trim()) {
      showToast({ type: 'warning', message: '请输入搜索关键词' });
      return;
    }
    saveSearchHistory(searchQuery);
    setLoading(true);

    try {
      const response = await sourceApi.globalSearch(searchQuery);
      if (response.code === 200) {
        const results = response.data?.results || [];
        // 按source_id分组
        const grouped: Record<string, Book[]> = {};
        results.forEach((book: Book) => {
          const sid = book.source_id || book.sourceId || 'unknown';
          if (!grouped[sid]) grouped[sid] = [];
          grouped[sid].push(book);
        });
        // 转换为分组数组
        const groupedKeys = Object.keys(grouped);
        const orderedKeys = [
          ...SOURCE_ORDER.filter((id) => grouped[id]),
          ...groupedKeys.filter((id) => !SOURCE_ORDER.includes(id)),
        ];
        const groupedArr: GroupedResult[] = orderedKeys.map((sourceId) => ({
          sourceId,
          sourceName: SOURCE_NAMES[sourceId] || sourceId,
          books: grouped[sourceId].slice(0, MAX_ITEMS_PER_SOURCE),
          hasMore: grouped[sourceId].length > MAX_ITEMS_PER_SOURCE,
        }));
        setGroupedResults(groupedArr);
        setSearchResults(results);
      } else {
        throw new Error('搜索失败，请稍后重试');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '搜索失败，请重试';
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, saveSearchHistory, showToast]);

  // 单源搜索
  const handleSingleSourceSearch = useCallback(async (page: number = 1) => {
    setError(null);
    if (!searchQuery.trim()) {
      showToast({ type: 'warning', message: '请输入搜索关键词' });
      return;
    }
    if (page === 1) {
      saveSearchHistory(searchQuery);
      setLoading(true);
    }

    try {
      const response = await sourceApi.searchSource(selectedSource, searchQuery, page);
      if (response.code === 200) {
        const newBooks = response.data?.books || [];
        if (page === 1) {
          setSearchResults(newBooks);
        } else {
          setSearchResults(prev => [...prev, ...newBooks]);
        }
        setCurrentPage(page);
      } else {
        throw new Error('搜索失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '搜索失败，请重试';
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSource, saveSearchHistory, showToast]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    if (searchMode === 'global') {
      handleGlobalSearch();
    } else {
      handleSingleSourceSearch(1);
    }
  }, [searchMode, handleGlobalSearch, handleSingleSourceSearch]);

  const onRefresh = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setRefreshing(true);
    try {
      await handleSearch();
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, handleSearch]);

  // 切换到单源模式查看更多
  const handleViewMore = useCallback((sourceId: string) => {
    setSelectedSource(sourceId);
    setSearchMode('single');
    setCurrentPage(1);
    handleSingleSourceSearch(1);
  }, [handleSingleSourceSearch]);

  const getItemLayout = useCallback((_data: ArrayLike<Book> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderSearchResult = useCallback(({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.resultCard}
      activeOpacity={tokens.opacity.active}
      onPress={() => {
        const bookId = item.id.toString();
        const sourceId = item.source_id || item.sourceId;
        const coverUrl = item.cover_url || item.coverUrl || '';
        router.push({
          pathname: '/player',
          params: { bookId, sourceId, title: item.title || '', author: item.author || '', coverUrl }
        });
      }}
    >
      <CachedImage source={{ uri: item.cover_url || item.coverUrl }} style={styles.resultCover} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultAuthor} numberOfLines={1}>{item.author}</Text>
        <Text style={styles.resultDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.resultMeta}>
          <MaterialIcons name="play-circle-filled" size={16} color={tokens.colors.primary} />
          <Text style={styles.resultPlayCount}>
            {(getPlayCount(item) / 10000).toFixed(1)}万播放
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  // 渲染分组头部
  const renderSectionHeader = useCallback(({ section }: { section: GroupedResult }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.sourceName}</Text>
      {section.hasMore && (
        <TouchableOpacity onPress={() => handleViewMore(section.sourceId)}>
          <Text style={styles.viewMoreText}>查看更多 →</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [handleViewMore]);

  const renderListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <Text style={styles.resultCount}>
        找到 {searchMode === 'global' ? searchResults.length : searchResults.length} 个结果
      </Text>
      {searchMode === 'single' && (
        <Text style={styles.sourceLabel}>{SOURCE_NAMES[selectedSource] || selectedSource}</Text>
      )}
    </View>
  ), [searchResults.length, searchMode, selectedSource]);

  const renderErrorState = () => (
    <EmptyState
      icon="error-outline"
      title="搜索出错"
      subtitle={error || '搜索失败，请重试'}
      actionText="重试"
      onAction={handleSearch}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="search"
        title="搜索书籍"
        subtitle="输入书名、作者或关键词开始搜索"
      />
      <SearchSuggestions
        suggestions={localSuggestions}
        onSuggestionPress={(text) => {
          setSearchQuery(text);
          handleSearch();
        }}
        onClearHistory={clearSearchHistory}
      />
    </View>
  );

  const renderNoResults = () => (
    <EmptyState
      icon="search-off"
      title="未找到相关书籍"
      subtitle="试试其他关键词或浏览推荐内容"
    />
  );

  // 渲染全局搜索结果（分组）
  const renderGlobalResults = () => {
    const sections = groupedResults.map(g => ({
      ...g,
      data: g.books,
    }));

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.source_id || item.sourceId}-${item.id}-${index}`}
        renderItem={renderSearchResult}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderListHeader}
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // 渲染单源搜索结果
  const renderSingleSourceResults = () => (
    <FlatList
      data={searchResults}
      renderItem={renderSearchResult}
      keyExtractor={(item, index) => `${item.source_id || item.sourceId || 'unknown'}-${item.id}-${index}`}
      getItemLayout={getItemLayout}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={renderListHeader}
      style={styles.resultsList}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      onEndReached={() => {
        if (!loading && searchResults.length >= currentPage * 20) {
          handleSingleSourceSearch(currentPage + 1);
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <View style={styles.container}>
        {/* 搜索栏 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={tokens.colors.text.tertiary} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="搜索书籍、作者..."
              placeholderTextColor={tokens.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={tokens.opacity.active}>
                <MaterialIcons name="clear" size={20} color={tokens.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          <Button variant="primary" size="small" onPress={handleSearch}>
            搜索
          </Button>
        </View>

        {/* 模式切换 */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'global' && styles.modeButtonActive]}
            onPress={() => { setSearchMode('global'); setSearchResults([]); setGroupedResults([]); }}
          >
            <Text style={[styles.modeButtonText, searchMode === 'global' && styles.modeButtonTextActive]}>
              全部音源
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'single' && styles.modeButtonActive]}
            onPress={() => setSearchMode('single')}
          >
            <Text style={[styles.modeButtonText, searchMode === 'single' && styles.modeButtonTextActive]}>
              单音源
            </Text>
          </TouchableOpacity>
        </View>

        {/* 单源选择器 */}
        {searchMode === 'single' && (
          <View style={styles.sourceSelector}>
            {SOURCE_ORDER.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.sourceChip, selectedSource === id && styles.sourceChipActive]}
                onPress={() => { setSelectedSource(id); setSearchResults([]); }}
              >
                <Text style={[styles.sourceChipText, selectedSource === id && styles.sourceChipTextActive]}>
                  {SOURCE_NAMES[id] || id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 内容区域 */}
        {loading ? (
          <Loading visible={true} fullScreen={false} />
        ) : error ? (
          renderErrorState()
        ) : searchQuery.trim() === '' || (searchResults.length === 0 && groupedResults.length === 0) ? (
          searchQuery.trim() === '' ? renderEmptyState() : renderNoResults()
        ) : searchMode === 'global' ? (
          renderGlobalResults()
        ) : (
          renderSingleSourceResults()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  searchContainer: {
    flexDirection: 'row', padding: tokens.spacing.md, backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border.light, alignItems: 'center', gap: tokens.spacing.md,
  },
  searchInputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.full, paddingHorizontal: tokens.spacing.md,
  },
  searchInput: {
    flex: 1, marginLeft: tokens.spacing.sm, marginRight: tokens.spacing.sm, fontSize: tokens.typography.body,
    color: tokens.colors.text.primary, paddingVertical: tokens.spacing.md,
  },
  modeSwitch: {
    flexDirection: 'row', paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface, gap: tokens.spacing.sm,
  },
  modeButton: {
    paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full, backgroundColor: tokens.colors.background,
  },
  modeButtonActive: { backgroundColor: tokens.colors.primary },
  modeButtonText: { fontSize: tokens.typography.caption, color: tokens.colors.text.secondary },
  modeButtonTextActive: { color: '#fff' },
  sourceSelector: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface, gap: tokens.spacing.xs, borderBottomWidth: 1, borderBottomColor: tokens.colors.border.light,
  },
  sourceChip: {
    paddingVertical: 4, paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.background, borderWidth: 1, borderColor: tokens.colors.border.light,
  },
  sourceChipActive: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  sourceChipText: { fontSize: tokens.typography.small, color: tokens.colors.text.secondary },
  sourceChipTextActive: { color: '#fff' },
  emptyContainer: { flex: 1 },
  resultsList: { flex: 1, padding: tokens.spacing.md },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm,
  },
  resultCount: { fontSize: tokens.typography.caption, color: tokens.colors.text.secondary },
  sourceLabel: { fontSize: tokens.typography.caption, color: tokens.colors.primary },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.xs,
    marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border.light,
  },
  sectionTitle: { fontSize: tokens.typography.body, fontWeight: tokens.fontWeight.semibold, color: tokens.colors.text.primary },
  viewMoreText: { fontSize: tokens.typography.caption, color: tokens.colors.primary },
  resultCard: {
    flexDirection: 'row', backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md,
    padding: tokens.spacing.md, marginBottom: tokens.spacing.md, ...tokens.shadows.md,
  },
  resultCover: { width: 80, height: 100, borderRadius: tokens.radius.sm },
  resultInfo: { flex: 1, marginLeft: tokens.spacing.md, justifyContent: 'space-between' },
  resultTitle: {
    fontSize: tokens.typography.body, fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary, marginBottom: 4,
  },
  resultAuthor: { fontSize: tokens.typography.caption, color: tokens.colors.text.secondary, marginBottom: tokens.spacing.sm },
  resultDescription: { fontSize: tokens.typography.small, color: tokens.colors.text.tertiary, lineHeight: 16, marginBottom: tokens.spacing.sm },
  resultMeta: { flexDirection: 'row', alignItems: 'center' },
  resultPlayCount: { fontSize: tokens.typography.small, color: tokens.colors.primary, marginLeft: 4 },
});

export default SearchScreen;
