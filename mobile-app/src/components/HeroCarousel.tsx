import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {HERO_BOOKS, getBookCoverUrl} from '../data/mockData';
import {BookWithStats} from '../types';
import {
  COLORS,
  SPACING,
  SIZES,
  SHADOWS,
  CAROUSEL_CONFIG,
  STATS_CONFIG,
} from '../constants/design-tokens';

const {width} = Dimensions.get('window');

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 自动轮播 - 修复依赖数组
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % HERO_BOOKS.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({x: nextIndex * width, animated: true});
    }, CAROUSEL_CONFIG.autoScrollInterval);

    return () => clearInterval(timer);
  }, [currentIndex, HERO_BOOKS.length]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  }, []);

  // 使用正确的类型
  const renderCarouselItem = useCallback((book: BookWithStats, index: number) => (
    <View key={book.id} style={[styles.carouselItem, {width}]}>
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
              <Image
                source={{uri: getBookCoverUrl(book)}}
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
                  {book.stats?.remainingTime || STATS_CONFIG.carousel.remainingTime}
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
  ), []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.carouselContainer}>
        {HERO_BOOKS.map((book, index) => renderCarouselItem(book, index))}
      </ScrollView>

      <View style={styles.paginationContainer}>
        {HERO_BOOKS.map((_, idx) => (
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketCard: {
    width: width - SPACING.md * 2,
    height: SIZES.hero.height,
    borderRadius: SIZES.hero.radius,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: SHADOWS.hero.shadowColor,
    shadowOffset: SHADOWS.hero.shadowOffset,
    shadowOpacity: SHADOWS.hero.shadowOpacity,
    shadowRadius: SHADOWS.hero.shadowRadius,
    elevation: SHADOWS.hero.elevation,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.heroCard.background,
    opacity: 0.9,
  },
  notch: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: COLORS.heroCard.notch,
    borderRadius: 12,
    top: '50%',
    marginTop: -12,
    zIndex: 20,
  },
  leftNotch: {
    left: -12,
  },
  rightNotch: {
    right: -12,
  },
  dashedLine: {
    position: 'absolute',
    top: '50%',
    left: SPACING.md,
    right: SPACING.md,
    height: 1,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    marginTop: -1,
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    padding: SIZES.hero.padding,
    justifyContent: 'space-between',
    zIndex: 20,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  bookInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  nowPlayingBadge: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  nowPlayingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  bookTitle: {
    fontSize: SIZES.typography?.h3 || 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    fontSize: SIZES.typography?.caption || 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  smallCoverContainer: {
    width: 64,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: SHADOWS.card.shadowColor,
    shadowOffset: SHADOWS.card.shadowOffset,
    shadowOpacity: SHADOWS.card.shadowOpacity,
    shadowRadius: SHADOWS.card.shadowRadius,
    elevation: SHADOWS.card.elevation,
  },
  smallCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: SIZES.typography?.small || 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  playButton: {
    width: SIZES.button.play,
    height: SIZES.button.play,
    backgroundColor: COLORS.text.primary,
    borderRadius: SIZES.button.play / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: SHADOWS.button.shadowColor,
    shadowOffset: SHADOWS.button.shadowOffset,
    shadowOpacity: SHADOWS.button.shadowOpacity,
    shadowRadius: SHADOWS.button.shadowRadius,
    elevation: SHADOWS.button.elevation,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
