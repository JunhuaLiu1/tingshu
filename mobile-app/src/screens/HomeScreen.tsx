import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Book, Category} from '../types';
import {CATEGORIES, HERO_BOOKS, EDITORS_PICKS, RANKING_BOOKS} from '../data/mockData';
import HeroCarousel from '../components/HeroCarousel';
import CategoryTabs from '../components/CategoryTabs';
import EditorsPick from '../components/EditorsPick';
import Rankings from '../components/Rankings';

const HomeScreen: React.FC = () => {
  const [, setLoading] = useState(false);

  useEffect(() => {
    // 使用本地模拟数据，无需异步加载
    console.log('Home screen loaded with mock data');
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" />
        <Text style={styles.searchPlaceholder}>搜索书籍、作者...</Text>
      </View>

      {/* 轮播图 */}
      <HeroCarousel />

      {/* 分类标签 */}
      <CategoryTabs />

      {/* 编辑推荐 */}
      <EditorsPick />

      {/* 排行榜 */}
      <Rankings />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    flex: 1,
  },
});

export default HomeScreen;