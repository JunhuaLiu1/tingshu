import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {MaterialIcons} from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import CachedImage from '../components/common/CachedImage';
import { useToast } from '../contexts/ToastContext';
import { scale, isSmallScreen } from '../utils/responsive';

const {width} = Dimensions.get('window');

interface Episode {
  id: number;
  title: string;
  duration: number;
  episode_num: number;
}

const PlayerScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { showToast } = useToast();
  
  const [episodes] = useState<Episode[]>([
    {id: 1, title: '第一集：开始的地方', duration: 1800, episode_num: 1},
    {id: 2, title: '第二集：冒险开始', duration: 2100, episode_num: 2},
    {id: 3, title: '第三集：遇到困难', duration: 1950, episode_num: 3},
    {id: 4, title: '第四集：新的伙伴', duration: 2250, episode_num: 4},
  ]);

  useEffect(() => {
    setCurrentEpisode(episodes[0]);
    setDuration(episodes[0].duration);
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    showToast({ 
      type: 'info', 
      message: isPlaying ? '已暂停' : '开始播放',
      duration: 1000 
    });
  };

  const onSliderValueChange = (value: number) => {
    setCurrentTime(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
    showToast({ 
      type: 'info', 
      message: `播放速度: ${rates[nextIndex]}x`,
      duration: 1000 
    });
  };

  const selectEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setDuration(episode.duration);
    setCurrentTime(0);
    if (isPlaying) {
      setIsPlaying(false);
    }
    showToast({ 
      type: 'success', 
      message: `切换到 ${episode.title}`,
      duration: 1500 
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showToast({ 
      type: 'success', 
      message: isFavorite ? '已取消收藏' : '已添加收藏' 
    });
  };

  const handleShare = () => {
    showToast({ type: 'info', message: '分享功能开发中' });
  };

  const getCoverSize = () => {
    if (isSmallScreen()) return width * 0.7;
    return width * 0.75;
  };

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 封面区域 */}
        <View style={styles.coverContainer}>
          <CachedImage
            source={{uri: 'https://picsum.photos/600/600?random=1'}}
            style={[styles.cover, { width: getCoverSize(), height: getCoverSize() }]}
          />
          <View style={styles.coverOverlay}>
            <Text style={styles.bookTitle}>百年孤独</Text>
            <Text style={styles.bookAuthor}>加西亚·马尔克斯</Text>
          </View>
        </View>

        {/* 播放控制 */}
        <View style={styles.controlContainer}>
          {/* 进度条 */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={currentTime}
              onValueChange={onSliderValueChange}
              minimumTrackTintColor={tokens.colors.primary}
              maximumTrackTintColor={tokens.colors.border.default}
              thumbTintColor={tokens.colors.primary}
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* 控制按钮 */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons name="skip-previous" size={32} color={tokens.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playButton} 
              onPress={togglePlayPause}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={40}
                color={tokens.colors.text.inverse}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons name="skip-next" size={32} color={tokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 额外控制 */}
          <View style={styles.extraControls}>
            <TouchableOpacity 
              style={styles.extraControlButton}
              onPress={toggleFavorite}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons 
                name={isFavorite ? 'favorite' : 'favorite-border'} 
                size={24} 
                color={isFavorite ? tokens.colors.primary : tokens.colors.text.tertiary} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.extraControlButton}
              onPress={changePlaybackRate}
              activeOpacity={tokens.opacity.active}
            >
              <Text style={styles.playbackRateText}>{playbackRate}x</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.extraControlButton}
              onPress={handleShare}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons name="share" size={24} color={tokens.colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.extraControlButton}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons name="more-horiz" size={24} color={tokens.colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 当前播放信息 */}
        {currentEpisode && (
          <View style={styles.nowPlaying}>
            <Text style={styles.nowPlayingTitle}>正在播放</Text>
            <Text style={styles.nowPlayingEpisode}>{currentEpisode.title}</Text>
          </View>
        )}

        {/* 剧集列表 */}
        <View style={styles.episodesContainer}>
          <Text style={styles.episodesTitle}>剧集列表</Text>
          {episodes.map((episode) => (
            <TouchableOpacity
              key={episode.id}
              style={[
                styles.episodeItem,
                currentEpisode?.id === episode.id && styles.episodeItemActive,
              ]}
              onPress={() => selectEpisode(episode)}
              activeOpacity={tokens.opacity.active}
            >
              <View style={styles.episodeInfo}>
                <View
                  style={[
                    styles.episodeNumber,
                    currentEpisode?.id === episode.id && styles.episodeNumberActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.episodeNumberText,
                      currentEpisode?.id === episode.id && styles.episodeNumberTextActive,
                    ]}
                  >
                    {episode.episode_num}
                  </Text>
                </View>
                <View style={styles.episodeText}>
                  <Text
                    style={[
                      styles.episodeTitle,
                      currentEpisode?.id === episode.id && styles.episodeTitleActive,
                    ]}
                  >
                    {episode.title}
                  </Text>
                  <Text style={styles.episodeDuration}>
                    {formatTime(episode.duration)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.downloadButton}
                activeOpacity={tokens.opacity.active}
              >
                <MaterialIcons
                  name="file-download"
                  size={20}
                  color={currentEpisode?.id === episode.id ? tokens.colors.primary : tokens.colors.text.tertiary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  coverContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: tokens.spacing.xxl,
    marginBottom: tokens.spacing.xl,
  },
  cover: {
    borderRadius: tokens.radius.lg,
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: tokens.spacing.md,
    borderBottomLeftRadius: tokens.radius.lg,
    borderBottomRightRadius: tokens.radius.lg,
  },
  bookTitle: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.h3,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: 4,
  },
  bookAuthor: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.caption,
    opacity: 0.9,
  },
  controlContainer: {
    backgroundColor: tokens.colors.surface,
    margin: tokens.spacing.md,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    ...tokens.shadows.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  timeText: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.secondary,
    width: 40,
  },
  slider: {
    flex: 1,
    marginHorizontal: tokens.spacing.md,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  controlButton: {
    padding: tokens.spacing.md,
  },
  playButton: {
    backgroundColor: tokens.colors.primary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    marginHorizontal: tokens.spacing.lg,
  },
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  extraControlButton: {
    padding: tokens.spacing.sm,
  },
  playbackRateText: {
    fontSize: tokens.typography.caption,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },
  nowPlaying: {
    margin: tokens.spacing.md,
    marginTop: 0,
    padding: tokens.spacing.md,
    backgroundColor: '#FFF3E0',
    borderRadius: tokens.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.primary,
  },
  nowPlayingTitle: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
    marginBottom: 4,
  },
  nowPlayingEpisode: {
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  episodesContainer: {
    margin: tokens.spacing.md,
    marginTop: 0,
  },
  episodesTitle: {
    fontSize: tokens.typography.h3,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    marginBottom: tokens.spacing.sm,
  },
  episodeItemActive: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  episodeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  episodeNumber: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  episodeNumberActive: {
    backgroundColor: tokens.colors.primary,
  },
  episodeNumberText: {
    color: tokens.colors.text.secondary,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: tokens.typography.caption,
  },
  episodeNumberTextActive: {
    color: tokens.colors.text.inverse,
  },
  episodeText: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: tokens.typography.caption,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  episodeTitleActive: {
    color: tokens.colors.primary,
  },
  episodeDuration: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
  },
  downloadButton: {
    padding: tokens.spacing.sm,
  },
});

export default PlayerScreen;