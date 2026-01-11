import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
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
const SOURCE_NAMES: Record<string, string> = {
  ximalaya: '喜马拉雅',
  kuwo: '酷我听书',
  huanting: '一夜听书',
  shuyinfm: '书音FM',
  ting78: '七八听书',
  tingsm: '听书迷',
  leting8: '乐听吧',
  missevan: '猫耳FM',
};
const EPISODES_PER_PAGE = 50;

const parseEpisodeCount = (value?: string) => {
  if (!value) return 0;
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

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
  const episodesPerPage = EPISODES_PER_PAGE;
  const [episodePage, setEpisodePage] = useState(1);
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
    bookMetadata: {
      title: book?.title || fallbackTitle || '未知书名',
      author: book?.author || fallbackAuthor || '未知作者',
      coverUrl: book?.cover_url || book?.coverUrl || fallbackCoverUrl || '',
    },
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
            setEpisodePage(1);
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
            setEpisodePage(1);
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

  const getCoverSize = () => (isSmallScreen() ? width * 0.75 : width * 0.8);

  const displayTitle = book?.title || fallbackTitle || '未知书名';
  const displayAuthor = book?.author || fallbackAuthor || '未知作者';
  const displayCoverUrl = book?.cover_url || book?.coverUrl || fallbackCoverUrl || 'https://picsum.photos/600/600?random=1';
  const sourceLabel = sourceId ? (SOURCE_NAMES[sourceId] || sourceId) : '本地书库';
  const episodeCountFromBook = Math.max(
    typeof book?.chapter_count === 'number' ? book.chapter_count : 0,
    typeof book?.chapterCount === 'number' ? book.chapterCount : 0,
    parseEpisodeCount(book?.status)
  );
  const totalEpisodeCount = episodes.length > 0 ? episodes.length : episodeCountFromBook;
  const statusLabel = totalEpisodeCount > 0 ? `共 ${totalEpisodeCount} 集` : '';
  const coverSize = getCoverSize();

  const isLoading = loading || playbackState.status === 'loading';
  const isPlaying = playbackState.status === 'playing';
  const displayTime = isSeeking ? seekValue : playbackState.currentTime;
  const totalPages = totalEpisodeCount > 0 ? Math.ceil(totalEpisodeCount / episodesPerPage) : 1;
  const pageStartIndex = (episodePage - 1) * episodesPerPage;
  const pageEpisodes = episodes.slice(pageStartIndex, pageStartIndex + episodesPerPage);
  const hasEpisodes = totalEpisodeCount > 0 && pageEpisodes.length > 0;
  const rangeStart = hasEpisodes ? pageStartIndex + 1 : 0;
  const rangeEnd = hasEpisodes
    ? Math.min(pageStartIndex + pageEpisodes.length, totalEpisodeCount)
    : 0;
  const rangeLabel = hasEpisodes
    ? `${rangeStart}-${rangeEnd}`
    : '';

  useEffect(() => {
    if (!totalEpisodeCount) return;
    const nextTotalPages = Math.max(1, Math.ceil(totalEpisodeCount / episodesPerPage));
    if (episodePage > nextTotalPages) {
      setEpisodePage(nextTotalPages);
    }
  }, [totalEpisodeCount, episodesPerPage, episodePage]);

  useEffect(() => {
    if (!currentEpisode) return;
    const index = episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (index < 0) return;
    const targetPage = Math.floor(index / episodesPerPage) + 1;
    setEpisodePage(targetPage);
  }, [currentEpisode, episodes, episodesPerPage]);

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <Loading visible={true} fullScreen={false} />}

        {/* 顶部区域: 封面与信息 */}
        <View style={styles.heroSection}>
          <View style={[styles.coverContainer, { width: coverSize, height: coverSize, marginBottom: tokens.spacing.xl }]}>
            <View style={styles.coverShadow} />
            <CachedImage
              source={{ uri: displayCoverUrl }}
              style={styles.coverImage}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.bookTitle} numberOfLines={2}>{displayTitle}</Text>
            <Text style={styles.bookAuthor}>{displayAuthor}</Text>

            <View style={styles.tagsRow}>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>{sourceLabel}</Text>
              </View>
              {statusLabel ? (
                <View style={styles.tagChip}>
                  <Text style={styles.tagText}>{statusLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* 播放器控制区域 */}
        <View style={styles.playerControls}>
          {/* 进度条 */}
          <View style={styles.sliderContainer}>
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
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
              <Text style={styles.timeText}>{formatTime(playbackState.duration)}</Text>
            </View>
          </View>

          {/* 主控制按钮 */}
          <View style={styles.mainControls}>
            <TouchableOpacity style={styles.controlBtnSmall} onPress={playPrev}>
              <MaterialIcons name="skip-previous" size={32} color={tokens.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playPauseBtn}
              onPress={togglePlayPause}
              disabled={playbackState.status === 'loading'}
              activeOpacity={0.8}
            >
              {playbackState.isBuffering ? (
                <MaterialIcons name="hourglass-empty" size={36} color={tokens.colors.text.inverse} />
              ) : (
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={48}
                  color={tokens.colors.text.inverse}
                  style={{ marginLeft: isPlaying ? 0 : 4 }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtnSmall} onPress={playNext}>
              <MaterialIcons name="skip-next" size={32} color={tokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 辅助操作 */}
          <View style={styles.auxControls}>
            <TouchableOpacity style={styles.auxBtn} onPress={toggleFavorite}>
              <MaterialIcons
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={22}
                color={isFavorite ? tokens.colors.primary : tokens.colors.text.secondary}
              />
              <Text style={[styles.auxText, isFavorite && { color: tokens.colors.primary }]}>收藏</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.auxBtn} onPress={changePlaybackRate}>
              <Text style={styles.speedText}>{playbackState.playbackRate}x</Text>
              <Text style={styles.auxText}>倍速</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.auxBtn} onPress={() => showToast({ type: 'info', message: '分享功能开发中' })}>
              <MaterialIcons name="share" size={22} color={tokens.colors.text.secondary} />
              <Text style={styles.auxText}>分享</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 剧集列表区域 */}
        <View style={styles.playlistSection}>
          <View style={styles.playlistHeader}>
            <Text style={styles.playlistTitle}>选集</Text>
            {hasEpisodes && (
              <Text style={styles.playlistCount}>
                {rangeLabel} / {totalEpisodeCount}
              </Text>
            )}
          </View>

          {/* 分页控制 */}
          {totalEpisodeCount > episodesPerPage && (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={episodePage === 1}
                onPress={() => setEpisodePage(p => p - 1)}
                style={[styles.pageBtn, episodePage === 1 && styles.pageBtnDisabled]}
              >
                <MaterialIcons name="chevron-left" size={20} color={episodePage === 1 ? tokens.colors.text.tertiary : tokens.colors.text.secondary} />
              </TouchableOpacity>

              <Text style={styles.pageInfo}>{episodePage} / {totalPages}</Text>

              <TouchableOpacity
                disabled={episodePage >= totalPages}
                onPress={() => setEpisodePage(p => p + 1)}
                style={[styles.pageBtn, episodePage >= totalPages && styles.pageBtnDisabled]}
              >
                <MaterialIcons name="chevron-right" size={20} color={episodePage >= totalPages ? tokens.colors.text.tertiary : tokens.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.listContainer}>
            {pageEpisodes.map((episode, index) => {
              const isActive = currentEpisode?.id === episode.id;
              return (
                <TouchableOpacity
                  key={`${episode.id}-${index}`}
                  style={[styles.listItem, isActive && styles.listItemActive]}
                  onPress={() => selectEpisode(episode)}
                >
                  <View style={styles.listItemLeft}>
                    {isActive ? (
                      <MaterialIcons name="graphic-eq" size={16} color={tokens.colors.primary} style={{ marginRight: 8 }} />
                    ) : (
                      <Text style={styles.listIndex}>{episode.episode_num}</Text>
                    )}
                    <Text style={[styles.listTitle, isActive && styles.listTitleActive]} numberOfLines={1}>
                      {episode.title}
                    </Text>
                  </View>
                  <Text style={[styles.listDuration, isActive && styles.listDurationActive]}>
                    {formatTime(episode.duration)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {!hasEpisodes && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>暂无剧集信息</Text>
              </View>
            )}
          </View>
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
  content: {
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  coverContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverShadow: {
    position: 'absolute',
    top: 10,
    bottom: -10,
    left: 10,
    right: 10,
    borderRadius: tokens.radius.lg,
    backgroundColor: '#000',
    opacity: 0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.border.light,
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: tokens.spacing.sm,
  },
  bookTitle: {
    fontSize: tokens.typography.h2,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
    lineHeight: 32,
  },
  bookAuthor: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tagText: {
    fontSize: 12,
    color: tokens.colors.text.secondary,
    fontWeight: tokens.fontWeight.medium,
  },

  // Player Controls
  playerControls: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
  },
  sliderContainer: {
    marginBottom: tokens.spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.xs,
    marginTop: -8,
  },
  timeText: {
    fontSize: 12,
    color: tokens.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: tokens.spacing.xl,
  },
  controlBtnSmall: {
    padding: 8,
  },
  playPauseBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  auxControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: tokens.spacing.md,
  },
  auxBtn: {
    alignItems: 'center',
    gap: 4,
    minWidth: 50,
  },
  auxText: {
    fontSize: 10,
    color: tokens.colors.text.tertiary,
  },
  speedText: {
    fontSize: 18,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    lineHeight: 22,
  },

  // Playlist Section
  playlistSection: {
    flex: 1,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    backgroundColor: tokens.colors.surface,
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.lg,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  playlistTitle: {
    fontSize: tokens.typography.h3,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  playlistCount: {
    fontSize: 13,
    color: tokens.colors.text.tertiary,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: tokens.spacing.md,
    gap: 12,
  },
  pageBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: tokens.colors.background,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 13,
    color: tokens.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  listContainer: {
    marginTop: tokens.spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
  },
  listItemActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.04)',
    marginHorizontal: -tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderBottomColor: 'transparent',
    borderRadius: tokens.radius.md,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  listIndex: {
    fontSize: 13,
    color: tokens.colors.text.tertiary,
    width: 32,
    fontVariant: ['tabular-nums'],
  },
  listTitle: {
    fontSize: 15,
    color: tokens.colors.text.primary,
    flex: 1,
  },
  listTitleActive: {
    color: tokens.colors.primary,
    fontWeight: tokens.fontWeight.medium,
  },
  listDuration: {
    fontSize: 12,
    color: tokens.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  listDurationActive: {
    color: tokens.colors.primary,
    opacity: 0.8,
  },
  emptyState: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: tokens.colors.text.tertiary,
    fontSize: 14,
  },
});

export default PlayerScreen;
