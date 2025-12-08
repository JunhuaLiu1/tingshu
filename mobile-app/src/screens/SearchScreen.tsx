import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {Book} from '../types';
import {searchApi} from '../services/api';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import CachedImage from '../components/common/CachedImage';
import Loading from '../components/common/Loading';
import { useToast } from '../contexts/ToastContext';

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches] = useState(['三体', '百年孤独', '月亮与六便士']);
  const searchInputRef = useRef<TextInput>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast({ type: 'warning', message: '请输入搜索关键词' });
      return;
    }

    setLoading(true);
    try {
      const response = await searchApi.searchBooks(searchQuery);
      if (response.code === 200) {
        setSearchResults(response.data || []);
      }
    } catch (error) {
      showToast({ type: 'error', message: '搜索失败，请重试' });
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResult = ({item}: {item: Book}) => (
    <TouchableOpacity style={styles.resultCard} activeOpacity={tokens.opacity.active}>
      <CachedImage source={{uri: item.cover_url}} style={styles.resultCover} />
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
            {(item.play_count / 10000).toFixed(1)}万播放
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = (item: string) => (
    <TouchableOpacity
      key={item}
      style={styles.recentSearchItem}
      onPress={() => {
        setSearchQuery(item);
        handleSearch();
      }}
      activeOpacity={tokens.opacity.active}
    >
      <MaterialIcons name="history" size={16} color={tokens.colors.text.tertiary} />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="search"
        title="搜索书籍"
        subtitle="输入书名、作者或关键词开始搜索"
      />
      <View style={styles.recentSearchesContainer}>
        <Text style={styles.recentSearchesTitle}>最近搜索</Text>
        <View style={styles.recentSearchesList}>
          {recentSearches.map(renderRecentSearch)}
        </View>
      </View>
    </View>
  );

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

        {/* 搜索结果 */}
        <Loading visible={loading} fullScreen={false} />
        {!loading && (
          searchQuery.trim() === '' ? (
            renderEmptyState()
          ) : searchResults.length === 0 ? (
            renderNoResults()
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id.toString()}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
            />
          )
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
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.md,
    marginRight: tokens.spacing.md,
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
  recentSearchesContainer: {
    paddingHorizontal: tokens.spacing.xl,
    marginTop: tokens.spacing.lg,
  },
  recentSearchesTitle: {
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  recentSearchesList: {
    flexDirection: 'column',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    marginBottom: tokens.spacing.sm,
  },
  recentSearchText: {
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.primary,
  },
  resultsList: {
    flex: 1,
    padding: tokens.spacing.md,
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