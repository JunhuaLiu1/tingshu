import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CATEGORIES } from "../data/mockData";
import { Category } from "../types";
import {
  COLORS,
  SPACING,
  SIZES,
  CATEGORY_ICONS,
  SHADOWS,
} from "../constants/design-tokens";

type CategoryTabsProps = {
  categories?: Category[];
};

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories }) => {
  const categoriesData = categories && categories.length > 0 ? categories : CATEGORIES;
  const [activeId, setActiveId] = useState<number>(categoriesData[0].id);

  // 使用正确的类型
  const renderCategoryItem = useCallback(
    (category: Category) => {
      const isActive = category.id === activeId;
      const iconName = CATEGORY_ICONS[category.id] || "category";

      return (
        <TouchableOpacity
          key={category.id}
          style={[styles.categoryTab, isActive && styles.activeTab]}
          onPress={() => setActiveId(category.id)}
          activeOpacity={COLORS.opacity?.active || 0.8}
        >
          <View
            style={[
              styles.iconContainer,
              isActive && styles.activeIconContainer,
            ]}
          >
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
    },
    [activeId],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>分类</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categoriesData.slice(0, 3).map(renderCategoryItem)}
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
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  scrollContainer: {
    paddingRight: SPACING.md,
  },
  categoryTab: {
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.category.padding,
    borderRadius: SIZES.category.radius,
    marginRight: SPACING.sm,
    minWidth: SIZES.category.minWidth,
    backgroundColor: COLORS.category.inactiveBg,
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: SHADOWS.card.shadowOffset,
    shadowOpacity: SIZES.category.shadowOpacity,
    shadowRadius: SIZES.category.shadowRadius,
    elevation: SIZES.category.elevation,
  },
  activeTab: {
    backgroundColor: COLORS.surface,
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: SIZES.category.activeShadowOffset,
    shadowOpacity: SIZES.category.activeShadowOpacity,
    shadowRadius: SIZES.category.activeShadowRadius,
    elevation: SIZES.category.activeElevation,
    borderWidth: SIZES.category.borderWidth,
    borderColor: COLORS.border.light,
    transform: [{ scale: SIZES.category.transformScale }],
  },
  iconContainer: {
    width: SIZES.category.iconSize,
    height: SIZES.category.iconSize,
    borderRadius: SIZES.category.iconRadius,
    backgroundColor: COLORS.category.inactiveBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  activeIconContainer: {
    backgroundColor: COLORS.category.activeBg,
  },
  categoryText: {
    fontSize: SIZES.typography.small,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textAlign: "center",
  },
  activeText: {
    color: COLORS.text.primary,
  },
});

export default CategoryTabs;
