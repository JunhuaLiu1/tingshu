import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { audioCache } from '../services/audioCache';
import { sourceApi, playbackApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePlayHistoryItem } from './usePlayHistory';

export interface PlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  currentTime: number;
  duration: number;
  playbackRate: number;
  isBuffering: boolean;
}

export interface Episode {
  id: string;
  title: string;
  duration: number;
  episode_num: number;
  audio_url?: string;
  audio_proxy_url?: string;
  is_free?: boolean;
}

interface UseAudioPlayerOptions {
  sourceId: string;
  bookId: string;
  bookMetadata?: {
    title: string;
    author: string;
    coverUrl: string;
  };
  onError?: (error: string) => void;
}

const PROGRESS_KEY_PREFIX = 'playback_progress_';

export function useAudioPlayer({ sourceId, bookId, bookMetadata, onError }: UseAudioPlayerOptions) {
  const [state, setState] = useState<PlaybackState>({
    status: 'idle',
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    isBuffering: false,
  });
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化音频模式
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    return () => {
      unloadSound();
      if (progressSaveTimer.current) clearInterval(progressSaveTimer.current);
    };
  }, []);

  const unloadSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const saveProgress = useCallback(async (position: number, duration: number) => {
    if (!currentEpisode || !bookId) return;
    const key = `${PROGRESS_KEY_PREFIX}${bookId}_${currentEpisode.id}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      position,
      duration,
      updatedAt: Date.now(),
    }));
    // 同步到云端
    try {
      await playbackApi.saveProgress({
        book_id: bookId,
        episode_id: currentEpisode.id,
        position,
        duration,
      });
    } catch { }
  }, [currentEpisode, bookId]);

  const loadSavedProgress = async (episodeId: string): Promise<number> => {
    const key = `${PROGRESS_KEY_PREFIX}${bookId}_${episodeId}`;
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const { position } = JSON.parse(data);
        return position || 0;
      }
    } catch { }
    return 0;
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setState(s => ({ ...s, status: 'error' }));
        onError?.(status.error);
      }
      return;
    }

    setState(s => ({
      ...s,
      status: status.isPlaying ? 'playing' : 'paused',
      currentTime: status.positionMillis / 1000,
      duration: (status.durationMillis || 0) / 1000,
      isBuffering: status.isBuffering,
    }));

    if (status.didJustFinish) {
      setState(s => ({ ...s, status: 'paused', currentTime: 0 }));
    }
  };

  const loadEpisode = async (episode: Episode) => {
    setState(s => ({ ...s, status: 'loading' }));
    setCurrentEpisode(episode);
    setDownloadProgress(0);

    await unloadSound();

    try {
      let audioUrl = episode.audio_proxy_url;
      let fallbackUrl = episode.audio_url;

      if (sourceId && !audioUrl) {
        try {
          const response = await sourceApi.getSourceAudio(sourceId, episode.id);
          if (response.code === 200 && response.data?.audio_url) {
            const proxyUrl = response.data.audio_proxy_url;
            audioUrl = proxyUrl || response.data.audio_url;
            fallbackUrl = response.data.audio_url;
          } else if (!fallbackUrl) {
            throw new Error('获取音频地址失败');
          }
        } catch {
          if (!fallbackUrl) {
            throw new Error('获取音频地址失败');
          }
        }
      }

      if (!sourceId) {
        audioUrl = audioUrl || fallbackUrl;
      }
      if (!audioUrl) {
        audioUrl = fallbackUrl;
      }
      if (!audioUrl) throw new Error('无效的音频地址');

      const loadWithUrl = async (urlToUse: string) => {
        let localUrl = await audioCache.getCachedUrl(episode.id);
        if (!localUrl || localUrl !== urlToUse) {
          localUrl = await audioCache.cacheAudio(episode.id, urlToUse, setDownloadProgress);
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: localUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
      };

      try {
        await loadWithUrl(audioUrl);
      } catch (error) {
        if (fallbackUrl && fallbackUrl !== audioUrl) {
          await unloadSound();
          await loadWithUrl(fallbackUrl);
        } else {
          throw error;
        }
      }

      // 恢复上次播放位置
      const savedPosition = await loadSavedProgress(episode.id);
      if (savedPosition > 0 && soundRef.current) {
        await soundRef.current.setPositionAsync(savedPosition * 1000);
      }

      // Save to play history (one record per source+book)
      if (bookMetadata) {
        savePlayHistoryItem({
          id: `${sourceId || 'local'}_${bookId}`,
          bookId,
          title: bookMetadata.title,
          author: bookMetadata.author,
          coverUrl: bookMetadata.coverUrl,
          progress: savedPosition > 0 && episode.duration > 0 ? Math.round((savedPosition / episode.duration) * 100) : 0,
          duration: episode.duration,
          episodeId: episode.id,
          episodeTitle: episode.title,
          sourceId,
        });
      }

      setState(s => ({ ...s, status: 'paused' }));

      // 定时保存进度
      if (progressSaveTimer.current) clearInterval(progressSaveTimer.current);
      progressSaveTimer.current = setInterval(() => {
        if (soundRef.current) {
          soundRef.current.getStatusAsync().then(status => {
            if (status.isLoaded) {
              saveProgress(status.positionMillis / 1000, (status.durationMillis || 0) / 1000);
            }
          });
        }
      }, 5000);

    } catch (error) {
      setState(s => ({ ...s, status: 'error' }));
      onError?.(error instanceof Error ? error.message : '加载失败');
    }
  };

  const play = async () => {
    if (!soundRef.current) return;
    await soundRef.current.playAsync();
  };

  const pause = async () => {
    if (!soundRef.current) return;
    await soundRef.current.pauseAsync();
    // 暂停时保存进度
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      saveProgress(status.positionMillis / 1000, (status.durationMillis || 0) / 1000);
    }
  };

  const togglePlayPause = async () => {
    if (state.status === 'playing') {
      await pause();
    } else if (state.status === 'paused' || state.status === 'idle') {
      await play();
    }
  };

  const seekTo = async (position: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(position * 1000);
  };

  const setPlaybackRate = async (rate: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setRateAsync(rate, true);
    setState(s => ({ ...s, playbackRate: rate }));
  };

  const skipForward = async (seconds: number = 15) => {
    const newPosition = Math.min(state.currentTime + seconds, state.duration);
    await seekTo(newPosition);
  };

  const skipBackward = async (seconds: number = 15) => {
    const newPosition = Math.max(state.currentTime - seconds, 0);
    await seekTo(newPosition);
  };

  return {
    state,
    currentEpisode,
    downloadProgress,
    loadEpisode,
    play,
    pause,
    togglePlayPause,
    seekTo,
    setPlaybackRate,
    skipForward,
    skipBackward,
  };
}
