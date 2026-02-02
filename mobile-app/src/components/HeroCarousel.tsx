import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BookWithStats } from "../types";
import FallbackImage from "./common/FallbackImage";
import {
  COLORS,
  SPACING,
  SIZES,
  SHADOWS,
  CAROUSEL_CONFIG,
  STATS_CONFIG,
} from "../constants/design-tokens";

const { width } = Dimensions.get("window");

interface HeroCarouselProps {
  books: BookWithStats[];
}

// 获取封面 URL（兼容多种格式）
const getBookCoverUrl = (book: BookWithStats): string => {
  return book.cover_url || book.coverUrl || '';
};

const HeroCarousel: React.FC<HeroCarouselProps> = ({ books }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // 自动轮播
  useEffect(() => {
    if (books.length === 0) return;
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % books.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, CAROUSEL_CONFIG.autoScrollInterval);

    return () => clearInterval(timer);
  }, [currentIndex, books.length]);

  const handleMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setCurrentIndex(index);
    },
    [],
  );

  // 使用正确的类型
  const renderCarouselItem = useCallback(
    (book: BookWithStats, index: number) => (
      <View key={book.id} style={[styles.carouselItem, { width }]}>
        <View style={styles.ticketCard}>
          <View style={styles.backgroundGradient} />
          <View style={[styles.notch, styles.leftNotch]} />
          <View style={[styles.notch, styles.rightNotch]} />
          <View style={styles.dashedLine} />

          <View style={styles.cardContent}>
            <View style={styles.topSection}>
              <View style={styles.bookInfo}>
                <View style={styles.nowPlayingBadge}>
                  <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
                </View>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>
              </View>

              <View style={styles.smallCoverContainer}>
                <FallbackImage
                  uri={getBookCoverUrl(book)}
                  sourceId={book.source_id || book.sourceId}
                  style={styles.smallCover}
                />
              </View>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="headphones"
                    size={SIZES.icon.small}
                    color={COLORS.text.secondary}
                  />
                  <Text style={styles.statText}>
                    {book.stats?.playCount || STATS_CONFIG.carousel.playCount}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="schedule"
                    size={SIZES.icon.small}
                    color={COLORS.text.secondary}
                  />
                  <Text style={styles.statText}>
                    {book.stats?.remainingTime ||
                      STATS_CONFIG.carousel.remainingTime}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.playButton}>
                <MaterialIcons
                  name="play-arrow"
                  size={SIZES.icon.medium}
                  color={COLORS.text.inverse}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.carouselContainer}
      >
        {books.map((book, index) => renderCarouselItem(book, index))}
      </ScrollView>

      <View style={styles.paginationContainer}>
        {books.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.paginationDot,
              idx === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  carouselContainer: {
    height: SIZES.carousel.containerHeight,
  },
  carouselItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  ticketCard: {
    width: width - SPACING.md * 2,
    height: SIZES.hero.height,
    borderRadius: SIZES.hero.radius,
    overflow: "hidden",
    position: "relative",
    shadowColor: SHADOWS.hero.shadowColor,
    shadowOffset: SHADOWS.hero.shadowOffset,
    shadowOpacity: SHADOWS.hero.shadowOpacity,
    shadowRadius: SHADOWS.hero.shadowRadius,
    elevation: SHADOWS.hero.elevation,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.heroCard.background,
    opacity: COLORS.heroCard.overlayOpacity,
  },
  notch: {
    position: "absolute",
    width: CAROUSEL_CONFIG.notchSize,
    height: CAROUSEL_CONFIG.notchSize,
    backgroundColor: COLORS.heroCard.notch,
    borderRadius: CAROUSEL_CONFIG.notchSize / 2,
    top: "50%",
    marginTop: -CAROUSEL_CONFIG.notchOffset,
    zIndex: 20,
  },
  leftNotch: {
    left: -CAROUSEL_CONFIG.notchOffset,
  },
  rightNotch: {
    right: -CAROUSEL_CONFIG.notchOffset,
  },
  dashedLine: {
    position: "absolute",
    top: "50%",
    left: SPACING.md,
    right: SPACING.md,
    height: CAROUSEL_CONFIG.dashedLineOffset,
    borderTopWidth: CAROUSEL_CONFIG.dashedLineWidth,
    borderTopColor: COLORS.border.dashed,
    borderStyle: "dashed",
    marginTop: -CAROUSEL_CONFIG.dashedLineOffset,
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    padding: SIZES.hero.padding,
    justifyContent: "space-between",
    zIndex: 20,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
  },
  bookInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  nowPlayingBadge: {
    backgroundColor: COLORS.heroCard.badgeOverlay,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SIZES.badge.paddingVertical,
    borderRadius: SIZES.badge.radius,
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  nowPlayingText: {
    fontSize: SIZES.typography.badge,
    fontWeight: "bold",
    color: COLORS.text.secondary,
    letterSpacing: SIZES.badge.letterSpacing,
  },
  bookTitle: {
    fontSize: SIZES.typography.h3,
    fontWeight: "bold",
    color: COLORS.text.primary,
    lineHeight: SIZES.lineHeight.h3,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    fontSize: SIZES.typography.caption,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  smallCoverContainer: {
    width: SIZES.hero.smallCoverWidth,
    height: SIZES.hero.smallCoverHeight,
    borderRadius: SIZES.hero.smallCoverRadius,
    overflow: "hidden",
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: SHADOWS.card.shadowOffset,
    shadowOpacity: SHADOWS.card.shadowOpacity,
    shadowRadius: SHADOWS.card.shadowRadius,
    elevation: SHADOWS.card.elevation,
  },
  smallCover: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.sm,
  },
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: SIZES.typography?.small || 12,
    fontWeight: "600",
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  playButton: {
    width: SIZES.button.play,
    height: SIZES.button.play,
    backgroundColor: COLORS.text.primary,
    borderRadius: SIZES.button.play / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: SHADOWS.button.shadowColor,
    shadowOffset: SHADOWS.button.shadowOffset,
    shadowOpacity: SHADOWS.button.shadowOpacity,
    shadowRadius: SHADOWS.button.shadowRadius,
    elevation: SHADOWS.button.elevation,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  paginationDot: {
    height: CAROUSEL_CONFIG.paginationDotWidth,
    borderRadius: CAROUSEL_CONFIG.paginationDotWidth / 2,
    marginHorizontal: SPACING.xs,
  },
  activeDot: {
    width: CAROUSEL_CONFIG.paginationActiveWidth,
    backgroundColor: COLORS.text.primary,
  },
  inactiveDot: {
    width: CAROUSEL_CONFIG.paginationDotWidth,
    backgroundColor: COLORS.border.dark,
  },
});

export default HeroCarousel;
