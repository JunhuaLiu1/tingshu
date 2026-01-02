import React, { useState, useEffect } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import CachedImage from '../components/common/CachedImage';
import { useToast } from '../contexts/ToastContext';
import { isSmallScreen } from '../utils/responsive';
import { bookApi, sourceApi } from '../services/api';
import { Book } from '../types';
import Loading from '../components/common/Loading';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer, Episode } from '../hooks/useAudioPlayer';

const { width } = Dimensions.get('window');

const PlayerScreen: React.FC = () => {
  const params = useLocalSearchParams<{
    bookId?: string;
    sourceId?: string;
    title?: string;
    author?: string;
    coverUrl?: string;
  }>();
  const bookId = typeof params.bookId === 'string' ? params.bookId : '';
  const sourceId = typeof params.sourceId === 'string' ? params.sourceId : '';
  const fallbackTitle = typeof params.title === 'string' ? params.title : '';
  const fallbackAuthor = typeof params.author === 'string' ? params.author : '';
  const fallbackCoverUrl = typeof params.coverUrl === 'string' ? params.coverUrl : '';

  const [book, setBook] = useState<Book | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const { showToast } = useToast();

  const {
    state: playbackState,
    currentEpisode,
    downloadProgress,
    loadEpisode,
    togglePlayPause,
    seekTo,
    setPlaybackRate,
  } = useAudioPlayer({
    sourceId,
    bookId,
    onError: (error) => showToast({ type: 'error', message: error }),
  });

  useEffect(() => {
    const loadDetail = async () => {
      if (!bookId) return;
      setLoading(true);
      try {
        if (sourceId) {
          const response = await sourceApi.getSourceBookDetail(sourceId, bookId);
          if (response.code === 200 && response.data) {
            const detail = response.data as Book;
            const rawEpisodes = detail.chapters || detail.episodes || [];
            const list: Episode[] = rawEpisodes.map((ep: any, index: number) => ({
              id: ep.id.toString(),
              title: ep.title,
              duration: ep.duration || 0,
              episode_num: ep.episode_num || ep.index || index + 1,
              audio_url: ep.audio_url,
              audio_proxy_url: ep.audio_proxy_url,
              is_free: ep.is_free ?? true,
            }));
            setBook(detail);
            setEpisodes(list);
            if (list.length > 0) {
              loadEpisode(list[0]);
            } else {
              showToast({ type: 'warning', message: '暂无可播放章节' });
            }
          }
        } else {
          const numericId = parseInt(bookId, 10);
          if (Number.isNaN(numericId)) {
            showToast({ type: 'error', message: '书籍参数错误' });
            return;
          }
          const [bookResponse, episodeResponse] = await Promise.all([
            bookApi.getBookById(numericId),
            bookApi.getBookEpisodes(numericId),
          ]);
          if (bookResponse.code === 200 && bookResponse.data) {
            setBook(bookResponse.data);
          }
          if (episodeResponse.code === 200 && episodeResponse.data) {
            const list: Episode[] = episodeResponse.data.map((ep: any, index: number) => ({
              id: ep.id.toString(),
              title: ep.title,
              duration: ep.duration || 0,
              episode_num: ep.episode_num || index + 1,
              audio_url: ep.audio_url,
            }));
            setEpisodes(list);
            if (list.length > 0) {
              loadEpisode(list[0]);
            }
          }
        }
      } catch (err) {
        showToast({ type: 'error', message: err instanceof Error ? err.message : '加载失败' });
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [bookId, sourceId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (value: number) => {
    setIsSeeking(true);
    setSeekValue(value);
  };

  const handleSlidingComplete = async (value: number) => {
    setIsSeeking(false);
    await seekTo(value);
  };

  const changePlaybackRate = async () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
    const currentIndex = rates.indexOf(playbackState.playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    await setPlaybackRate(nextRate);
    showToast({ type: 'info', message: `播放速度: ${nextRate}x`, duration: 1000 });
  };

  const playPrev = async () => {
    if (!currentEpisode || episodes.length === 0) return;
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex <= 0) return;
    await loadEpisode(episodes[currentIndex - 1]);
    showToast({ type: 'success', message: `切换到 ${episodes[currentIndex - 1].title}`, duration: 1500 });
  };

  const playNext = async () => {
    if (!currentEpisode || episodes.length === 0) return;
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex < 0 || currentIndex >= episodes.length - 1) return;
    await loadEpisode(episodes[currentIndex + 1]);
    showToast({ type: 'success', message: `切换到 ${episodes[currentIndex + 1].title}`, duration: 1500 });
  };

  const selectEpisode = async (episode: Episode) => {
    await loadEpisode(episode);
    showToast({ type: 'success', message: `切换到 ${episode.title}`, duration: 1500 });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showToast({ type: 'success', message: isFavorite ? '已取消收藏' : '已添加收藏' });
  };

  const getCoverSize = () => (isSmallScreen() ? width * 0.7 : width * 0.75);

  const displayTitle = book?.title || fallbackTitle || '未知书名';
  const displayAuthor = book?.author || fallbackAuthor || '未知作者';
  const displayCoverUrl = book?.cover_url || book?.coverUrl || fallbackCoverUrl || 'https://picsum.photos/600/600?random=1';

  const isLoading = loading || playbackState.status === 'loading';
  const isPlaying = playbackState.status === 'playing';
  const displayTime = isSeeking ? seekValue : playbackState.currentTime;

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <Loading visible={true} fullScreen={false} />}

        {/* 下载进度 */}
        {playbackState.status === 'loading' && downloadProgress > 0 && downloadProgress < 1 && (
          <View style={styles.downloadProgress}>
            <Text style={styles.downloadText}>缓存中 {Math.round(downloadProgress * 100)}%</Text>
            <View style={styles.downloadBar}>
              <View style={[styles.downloadFill, { width: `${downloadProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* 封面区域 */}
        <View style={styles.coverContainer}>
          <CachedImage
            source={{ uri: displayCoverUrl }}
            style={[styles.cover, { width: getCoverSize(), height: getCoverSize() }]}
          />
          <View style={styles.coverOverlay}>
            <Text style={styles.bookTitle}>{displayTitle}</Text>
            <Text style={styles.bookAuthor}>{displayAuthor}</Text>
          </View>
        </View>

        {/* 播放控制 */}
        <View style={styles.controlContainer}>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={playbackState.duration || 1}
              value={displayTime}
              onValueChange={handleSliderChange}
              onSlidingComplete={handleSlidingComplete}
              minimumTrackTintColor={tokens.colors.primary}
              maximumTrackTintColor={tokens.colors.border.default}
              thumbTintColor={tokens.colors.primary}
            />
            <Text style={styles.timeText}>{formatTime(playbackState.duration)}</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={playPrev}>
              <MaterialIcons name="skip-previous" size={32} color={tokens.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={togglePlayPause}
              disabled={playbackState.status === 'loading'}
            >
              {playbackState.isBuffering ? (
                <MaterialIcons name="hourglass-empty" size={40} color={tokens.colors.text.inverse} />
              ) : (
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={40}
                  color={tokens.colors.text.inverse}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={playNext}>
              <MaterialIcons name="skip-next" size={32} color={tokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.extraControls}>
            <TouchableOpacity style={styles.extraControlButton} onPress={toggleFavorite}>
              <MaterialIcons
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={24}
                color={isFavorite ? tokens.colors.primary : tokens.colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.extraControlButton} onPress={changePlaybackRate}>
              <Text style={styles.playbackRateText}>{playbackState.playbackRate}x</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.extraControlButton} onPress={() => showToast({ type: 'info', message: '分享功能开发中' })}>
              <MaterialIcons name="share" size={24} color={tokens.colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.extraControlButton}>
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
          <Text style={styles.episodesTitle}>剧集列表 ({episodes.length})</Text>
          {episodes.map((episode, index) => (
            <TouchableOpacity
              key={`${episode.id}-${episode.episode_num}-${index}`}
              style={[
                styles.episodeItem,
                currentEpisode?.id === episode.id && styles.episodeItemActive,
              ]}
              onPress={() => selectEpisode(episode)}
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
                    numberOfLines={1}
                  >
                    {episode.title}
                  </Text>
                  <Text style={styles.episodeDuration}>{formatTime(episode.duration)}</Text>
                </View>
              </View>
              <MaterialIcons
                name="file-download"
                size={20}
                color={currentEpisode?.id === episode.id ? tokens.colors.primary : tokens.colors.text.tertiary}
              />
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
  downloadProgress: {
    margin: tokens.spacing.md,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.sm,
  },
  downloadText: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.secondary,
    marginBottom: 4,
  },
  downloadBar: {
    height: 4,
    backgroundColor: tokens.colors.border.default,
    borderRadius: 2,
  },
  downloadFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary,
    borderRadius: 2,
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
});

export default PlayerScreen;
