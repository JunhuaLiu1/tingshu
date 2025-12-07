import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {CATEGORIES} from '../data/mockData';

// 为每个分类分配图标
const CATEGORY_ICONS: Record<number, string> = {
  1: 'menu-book',      // 经典文学
  2: 'explore',        // 悬疑推理
  3: 'work',           // 职场成长
  4: 'favorite',       // 情感治愈
  5: 'history',        // 历史传奇
  6: 'rocket',         // 科幻未来
};

const CategoryTabs: React.FC = () => {
  const [activeId, setActiveId] = useState<number>(CATEGORIES[0].id);

  const renderCategoryItem = (category: any) => {
    const isActive = category.id === activeId;
    const iconName = CATEGORY_ICONS[category.id] || 'category';

    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryTab, isActive && styles.activeTab]}
        onPress={() => setActiveId(category.id)}
        activeOpacity={0.8}>
        <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
          <Icon
            name={iconName}
            size={20}
            color={isActive ? '#FF6B35' : '#999'}
          />
        </View>
        <Text style={[styles.categoryText, isActive && styles.activeText]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>分类</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {CATEGORIES.slice(0, 3).map(renderCategoryItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  scrollContainer: {
    paddingRight: 16,
  },
  categoryTab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    marginRight: 12,
    minWidth: 100,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    transform: [{scale: 1.02}],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeIconContainer: {
    backgroundColor: '#FFF5F0',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  activeText: {
    color: '#333',
  },
});

export default CategoryTabs;