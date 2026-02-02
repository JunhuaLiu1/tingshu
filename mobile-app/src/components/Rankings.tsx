import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Book } from "../types";
import FallbackImage from "./common/FallbackImage";
import { COLORS, SPACING, SIZES, SHADOWS } from "../constants/design-tokens";

interface RankingsProps {
  books: Book[];
}

// 获取封面 URL（兼容多种格式）
const getBookCoverUrl = (book: Book): string => {
  return book.cover_url || book.coverUrl || '';
};

const Rankings: React.FC<RankingsProps> = ({ books }) => {
  // 使用正确的类型
  const renderRankingItem = useCallback(
    ({ item }: { item: Book }) => (
      <TouchableOpacity
        style={styles.rankingItem}
        activeOpacity={COLORS.opacity?.active || 0.8}
      >
        <View style={styles.bookCoverContainer}>
          <FallbackImage
            uri={getBookCoverUrl(item)}
            sourceId={item.source_id || item.sourceId}
            style={styles.bookCover}
          />
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
        </View>

        <View style={styles.rankContainer}>
          <Text style={styles.rankNumber}>#{item.rank}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons
              name="more-horiz"
              size={SIZES.icon.medium}
              color={COLORS.border.dark}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>热门排行</Text>
        <TouchableOpacity style={styles.seeAllBadge}>
          <Text style={styles.seeAllText}>查看全部</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {books.slice(0, 4).map((item, index) => (
          <View key={item.id.toString()}>
            {renderRankingItem({ item })}
            {index < 3 && <View style={{ height: SPACING.sm }} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: SIZES.typography.h3,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  seeAllBadge: {
    backgroundColor: COLORS.ranking.badgeBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SIZES.ranking.badgePaddingVertical,
    borderRadius: SIZES.ranking.badgeRadius,
  },
  seeAllText: {
    fontSize: SIZES.typography.small,
    fontWeight: "bold",
    color: COLORS.ranking.badgeText,
  },
  listContainer: {
    paddingBottom: SPACING.sm,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.ranking?.padding || 12,
    borderRadius: SIZES.ranking.itemRadius,
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: SHADOWS.card.shadowOffset,
    shadowOpacity: SIZES.ranking.shadowOpacity,
    shadowRadius: SIZES.ranking.shadowRadius,
    elevation: SHADOWS.card.elevation,
    borderWidth: SIZES.ranking.borderWidth,
    borderColor: COLORS.border.light,
  },
  bookCoverContainer: {
    width: SIZES.ranking.coverSize,
    height: SIZES.ranking.coverSize,
    borderRadius: SIZES.ranking.radius,
    overflow: "hidden",
    backgroundColor: COLORS.background,
  },
  bookCover: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bookInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },
  bookTitle: {
    fontSize: SIZES.typography.caption,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    fontSize: SIZES.typography.small,
    color: COLORS.text.tertiary,
  },
  rankContainer: {
    alignItems: "center",
  },
  rankNumber: {
    fontSize: SIZES.typography.small,
    fontWeight: "bold",
    color: COLORS.border.dark,
    marginBottom: SPACING.xs,
  },
  moreButton: {
    padding: SPACING.xs,
  },
});

export default Rankings;
