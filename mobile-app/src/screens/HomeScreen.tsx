import React, {useEffect, useMemo} from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useRouter} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {CATEGORIES, HERO_BOOKS, EDITORS_PICKS, RANKING_BOOKS} from '../data/mockData';
import HeroCarousel from '../components/HeroCarousel';
import CategoryTabs from '../components/CategoryTabs';
import EditorsPick from '../components/EditorsPick';
import Rankings from '../components/Rankings';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import { prioritizeForeignAndClassics } from '../utils/homeRecommend';

const HomeScreen: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    console.log('Home screen loaded with mock data');
  }, []);

  const { heroBooks, editorsPicks, rankingBooks } = useMemo(() => {
    return {
      heroBooks: prioritizeForeignAndClassics(HERO_BOOKS),
      editorsPicks: prioritizeForeignAndClassics(EDITORS_PICKS),
      rankingBooks: prioritizeForeignAndClassics(RANKING_BOOKS),
    };
  }, []);

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 搜索栏 */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={tokens.opacity.active}
        >
          <MaterialIcons name="search" size={20} color={tokens.colors.text.tertiary} />
          <Text style={styles.searchPlaceholder}>搜索书籍、作者...</Text>
        </TouchableOpacity>

        {/* 轮播图 */}
        <HeroCarousel books={heroBooks} />

        {/* 分类标签 */}
        <CategoryTabs categories={CATEGORIES} />

        {/* 编辑推荐 */}
        <EditorsPick books={editorsPicks} title="世界名著推荐" />

        {/* 排行榜 */}
        <Rankings books={rankingBooks} title="经典小说排行" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
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
});

export default HomeScreen;
