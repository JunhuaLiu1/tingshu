import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {CATEGORIES} from '../data/mockData';
import {Category} from '../types';
import {
  COLORS,
  SPACING,
  SIZES,
  CATEGORY_ICONS,
  SHADOWS,
} from '../constants/design-tokens';

const CategoryTabs: React.FC = () => {
  const [activeId, setActiveId] = useState<number>(CATEGORIES[0].id);

  // 使用正确的类型
  const renderCategoryItem = useCallback((category: Category) => {
    const isActive = category.id === activeId;
    const iconName = CATEGORY_ICONS[category.id] || 'category';

    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryTab, isActive && styles.activeTab]}
        onPress={() => setActiveId(category.id)}
        activeOpacity={COLORS.opacity?.active || 0.8}>
        <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
          <MaterialIcons
            name={iconName as any}
            size={SIZES.icon.medium}
            color={isActive ? COLORS.primary : COLORS.text.tertiary}
          />
        </View>
        <Text style={[styles.categoryText, isActive && styles.activeText]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  }, [activeId]);

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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: SIZES.typography.h3,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  scrollContainer: {
    paddingRight: SPACING.md,
  },
  categoryTab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.category.padding,
    borderRadius: SIZES.category.radius,
    marginRight: SPACING.sm,
    minWidth: SIZES.category.minWidth,
    backgroundColor: COLORS.category.inactiveBg,
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: SHADOWS.card.shadowOffset,
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: SHADOWS.card.elevation,
  },
  activeTab: {
    backgroundColor: COLORS.surface,
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    transform: [{scale: 1.02}],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.category.inactiveBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activeIconContainer: {
    backgroundColor: COLORS.category.activeBg,
  },
  categoryText: {
    fontSize: SIZES.typography.small,
    fontWeight: '600',
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  activeText: {
    color: COLORS.text.primary,
  },
});

export default CategoryTabs;