import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORIES } from '../data/mockData';
import HeroCarousel from '../components/HeroCarousel';
import CategoryTabs from '../components/CategoryTabs';
import EditorsPick from '../components/EditorsPick';
import Rankings from '../components/Rankings';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import { prioritizeForeignAndClassics } from '../utils/homeRecommend';
import { useHomeData } from '../hooks/useHomeData';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const {
    heroBooks,
    editorsPicks,
    rankingBooks,
    isLoading,
    error,
    refresh,
  } = useHomeData();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const prioritizedHeroBooks = useMemo(
    () => prioritizeForeignAndClassics(heroBooks),
    [heroBooks],
  );
  const prioritizedEditorsPicks = useMemo(
    () => prioritizeForeignAndClassics(editorsPicks),
    [editorsPicks],
  );
  const prioritizedRankingBooks = useMemo(
    () => prioritizeForeignAndClassics(rankingBooks),
    [rankingBooks],
  );

  // 首次加载状态
  if (isLoading && heroBooks.length === 0) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tokens.colors.primary]}
            tintColor={tokens.colors.primary}
          />
        }
      >
        {/* 搜索栏 */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={tokens.opacity.active}
        >
          <MaterialIcons name="search" size={20} color={tokens.colors.text.tertiary} />
          <Text style={styles.searchPlaceholder}>搜索书籍、作者...</Text>
        </TouchableOpacity>

        {/* 错误提示 */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="info-outline" size={16} color={tokens.colors.text.secondary} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 轮播图 */}
        <HeroCarousel books={prioritizedHeroBooks} />

        {/* 分类标签 */}
        <CategoryTabs categories={CATEGORIES} />

        {/* 编辑推荐 */}
        <EditorsPick books={prioritizedEditorsPicks} title="世界名著推荐" />

        {/* 排行榜 */}
        <Rankings books={prioritizedRankingBooks} title="经典小说排行" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.body,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    margin: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    ...tokens.shadows.md,
  },
  searchPlaceholder: {
    marginLeft: tokens.spacing.sm,
    color: tokens.colors.text.tertiary,
    fontSize: tokens.typography.body,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.primary,
  },
  errorText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.small,
  },
});

export default HomeScreen;
