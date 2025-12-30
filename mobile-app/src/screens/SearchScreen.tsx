import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {Book} from '../types';
import {sourceApi} from '../services/api';
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

const getPlayCount = (item: Book) => {
  if (typeof item.play_count === 'number') return item.play_count;
  if (typeof item.playCount === 'string') {
    const parsed = parseInt(item.playCount, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const { showToast } = useToast();

  const {
    saveSearchHistory,
    clearSearchHistory,
    generateSuggestions,
  } = useSearchState();

  // 自动聚焦优化
  useEffect(() => {
    const timeout = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        searchInputRef.current?.focus();
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  // 实时生成搜索建议
  const localSuggestions = useMemo(
    () => generateSuggestions(searchQuery),
    [searchQuery, generateSuggestions]
  );

  // 搜索函数
  const handleSearch = useCallback(async () => {
    setError(null);

    if (!searchQuery.trim()) {
      showToast({ type: 'warning', message: '请输入搜索关键词' });
      return;
    }

    saveSearchHistory(searchQuery);
    setLoading(true);

    try {
      const response = await sourceApi.searchSource('ximalaya', searchQuery, 1);
      if (response.code === 200) {
        setSearchResults(response.data?.books || []);
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

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setRefreshing(true);
    try {
      await handleSearch();
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, handleSearch]);

  // 获取固定高度
  const getItemLayout = useCallback((data: Book[] | null, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // 渲染搜索结果
  const renderSearchResult = useCallback(({item}: {item: Book}) => (
    <TouchableOpacity
      style={styles.resultCard}
      activeOpacity={tokens.opacity.active}
      onPress={() => {
        const bookId = item.id.toString();
        const sourceId = item.source_id || item.sourceId;
        const coverUrl = item.cover_url || item.coverUrl || '';
        router.push({
          pathname: '/player',
          params: {
            bookId,
            sourceId,
            title: item.title || '',
            author: item.author || '',
            coverUrl,
          }
        });
      }}
    >
      <CachedImage source={{uri: item.cover_url || item.coverUrl}} style={styles.resultCover} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.resultAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.resultMeta}>
          <MaterialIcons name="play-circle-filled" size={16} color={tokens.colors.primary} />
          <Text style={styles.resultPlayCount}>
            {(getPlayCount(item) / 10000).toFixed(1)}万播放
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  // 渲染列表头部
  const renderListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <Text style={styles.resultCount}>
        找到 {searchResults.length} 个结果
      </Text>
    </View>
  ), [searchResults.length]);

  // 渲染错误状态
  const renderErrorState = () => (
    <EmptyState
      icon="error-outline"
      title="搜索出错"
      subtitle={error || '搜索失败，请重试'}
      actionText="重试"
      onActionPress={handleSearch}
    />
  );

  // 渲染空状态（搜索建议）
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

  // 渲染无结果
  const renderNoResults = () => (
    <EmptyState
      icon="search-off"
      title="未找到相关书籍"
      subtitle="试试其他关键词或浏览推荐内容"
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

        {/* 内容区域 */}
        {loading ? (
          <Loading visible={true} fullScreen={false} />
        ) : error ? (
          renderErrorState()
        ) : searchQuery.trim() === '' ? (
          renderEmptyState()
        ) : searchResults.length === 0 ? (
          renderNoResults()
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => `${item.source_id || item.sourceId || 'unknown'}-${item.id}`}
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
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
    marginRight: tokens.spacing.sm,
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
    paddingVertical: tokens.spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
    padding: tokens.spacing.md,
  },
  listHeader: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  resultCount: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  resultCover: {
    width: 80,
    height: 100,
    borderRadius: tokens.radius.sm,
  },
  resultInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  resultAuthor: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.sm,
  },
  resultDescription: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
    lineHeight: 16,
    marginBottom: tokens.spacing.sm,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultPlayCount: {
    fontSize: tokens.typography.small,
    color: tokens.colors.primary,
    marginLeft: 4,
  },
});

export default SearchScreen;
