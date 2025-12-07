import React, {useState, useEffect, useRef} from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import {HERO_BOOKS, getBookCoverUrl} from '../data/mockData';

const {width} = Dimensions.get('window');

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % HERO_BOOKS.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({x: nextIndex * width, animated: true});
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderCarouselItem = (book: any, index: number) => (
    <View key={book.id} style={[styles.carouselItem, {width}]}>
      {/* 票据式卡片 */}
      <View style={styles.ticketCard}>
        {/* 背景渐变效果 */}
        <View style={styles.backgroundGradient} />

        {/* 装饰圆圈（票据缺口） */}
        <View style={[styles.notch, styles.leftNotch]} />
        <View style={[styles.notch, styles.rightNotch]} />

        {/* 虚线分隔 */}
        <View style={styles.dashedLine} />

        {/* 内容布局 */}
        <View style={styles.cardContent}>
          {/* 上半部分：书籍信息 */}
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

            {/* 小封面图片 */}
            <View style={styles.smallCoverContainer}>
              <Image
                source={{uri: getBookCoverUrl(book)}}
                style={styles.smallCover}
              />
            </View>
          </View>

          {/* 下半部分：控制/统计 */}
          <View style={styles.bottomSection}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon name="headphones" size={14} color="#666" />
                <Text style={styles.statText}>1.2k</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="schedule" size={14} color="#666" />
                <Text style={styles.statText}>45m left</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playButton}>
              <Icon name="play-arrow" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 轮播容器 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.carouselContainer}>
        {HERO_BOOKS.map((book, index) => renderCarouselItem(book, index))}
      </ScrollView>

      {/* 分页点 */}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  carouselContainer: {
    height: 220,
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketCard: {
    width: width - 32,
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FDE4D0',
    opacity: 0.9,
  },
  notch: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#F5F6F8',
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
    left: 16,
    right: 16,
    height: 1,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    marginTop: -1,
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    padding: 24,
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
    marginRight: 16,
  },
  nowPlayingBadge: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  nowPlayingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  smallCoverContainer: {
    width: 64,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    paddingTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    spaceBetween: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#333',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#ccc',
  },
});

export default HeroCarousel;