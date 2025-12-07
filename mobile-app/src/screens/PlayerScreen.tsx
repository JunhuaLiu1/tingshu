import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Slider,
  ScrollView,
  Dimensions,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';
// 注意：在Expo Go中不支持原生音频模块
// 如果需要音频录制功能，请使用EAS构建或expo-av库

const {width, height} = Dimensions.get('window');

interface Episode {
  id: number;
  title: string;
  duration: number;
  episode_num: number;
}

const PlayerScreen: React.FC = () => {
  // const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
// 注意：在Expo Go中不支持原生音频模块

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
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

  const togglePlayPause = async () => {
    if (isPlaying) {
      await audioRecorderPlayer.pausePlay();
      setIsPlaying(false);
    } else {
      await audioRecorderPlayer.startPlayer();
      setIsPlaying(true);

      // 设置播放进度更新
      const interval = setInterval(async () => {
        const currentPosition = await audioRecorderPlayer.getCurrentDuration();
        setCurrentTime(Math.floor(currentPosition / 1000)); // 转换为秒
      }, 1000);

      return () => clearInterval(interval);
    }
  };

  const onSliderValueChange = async (value: number) => {
    setCurrentTime(value);
    await audioRecorderPlayer.seekToPlayer(value * 1000);
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
    audioRecorderPlayer.setPlaySpeed(rates[nextIndex]);
  };

  const selectEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setDuration(episode.duration);
    setCurrentTime(0);
    if (isPlaying) {
      audioRecorderPlayer.stopPlayer();
      setIsPlaying(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 封面区域 */}
      <View style={styles.coverContainer}>
        <Image
          source={{
            uri: 'https://picsum.photos/600/600?random=1',
          }}
          style={styles.cover}
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
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.thumb}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="skip-previous" size={32} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={40}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="skip-next" size={32} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 额外控制 */}
        <View style={styles.extraControls}>
          <TouchableOpacity style={styles.extraControlButton}>
            <MaterialIcons name="favorite-border" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.extraControlButton}
            onPress={changePlaybackRate}>
            <Text style={styles.playbackRateText}>{playbackRate}x</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.extraControlButton}>
            <MaterialIcons name="share" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.extraControlButton}>
            <MaterialIcons name="more-horiz" size={24} color="#999" />
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
        {episodes.map((episode, index) => (
          <TouchableOpacity
            key={episode.id}
            style={[
              styles.episodeItem,
              currentEpisode?.id === episode.id && styles.episodeItemActive,
            ]}
            onPress={() => selectEpisode(episode)}>
            <View style={styles.episodeInfo}>
              <Text
                style={[
                  styles.episodeNumber,
                  currentEpisode?.id === episode.id && styles.episodeNumberActive,
                ]}>
                {episode.episode_num}
              </Text>
              <View style={styles.episodeText}>
                <Text
                  style={[
                    styles.episodeTitle,
                    currentEpisode?.id === episode.id && styles.episodeTitleActive,
                  ]}>
                  {episode.title}
                </Text>
                <Text style={styles.episodeDuration}>
                  {formatTime(episode.duration)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <MaterialIcons
                name="file-download"
                size={20}
                color={
                  currentEpisode?.id === episode.id ? '#FF6B35' : '#999'
                }
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  coverContainer: {
    position: 'relative',
    width: width * 0.8,
    height: width * 0.8,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  cover: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bookTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  controlContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    width: 40,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
  },
  thumb: {
    width: 16,
    height: 16,
    backgroundColor: '#FF6B35',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 50,
    marginHorizontal: 24,
  },
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  extraControlButton: {
    padding: 8,
  },
  playbackRateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  nowPlaying: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  nowPlayingTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  nowPlayingEpisode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  episodesContainer: {
    margin: 16,
    marginTop: 0,
  },
  episodesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  episodeItemActive: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  episodeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  episodeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#666',
    fontWeight: '600',
    marginRight: 12,
  },
  episodeNumberActive: {
    backgroundColor: '#FF6B35',
    color: 'white',
  },
  episodeText: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  episodeTitleActive: {
    color: '#FF6B35',
  },
  episodeDuration: {
    fontSize: 12,
    color: '#999',
  },
  downloadButton: {
    padding: 8,
  },
});

export default PlayerScreen;