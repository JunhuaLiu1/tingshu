import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {Book} from '../types';
import {ALL_BOOKS, getBookCoverUrl, getBookPlayCount} from '../data/mockData';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import EmptyState from '../components/common/EmptyState';
import CachedImage from '../components/common/CachedImage';
import { useToast } from '../contexts/ToastContext';

interface PlayHistoryItem {
  id: string;
  book: Book;
  lastPlayed: Date;
  progress: number; // 播放进度百分比
  duration: number; // 总时长
}

const HistoryScreen: React.FC = () => {
  const { showToast } = useToast();
  const [history, setHistory] = useState<PlayHistoryItem[]>([
    {
      id: '1',
      book: ALL_BOOKS[0],
      lastPlayed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      progress: 65,
      duration: 3600,
    },
    {
      id: '2',
      book: ALL_BOOKS[1],
      lastPlayed: new Date(Date.now() - 5 * 60 * 60 * 1000),
      progress: 30,
      duration: 4200,
    },
    {
      id: '3',
      book: ALL_BOOKS[2],
      lastPlayed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      progress: 100,
      duration: 3000,
    },
    {
      id: '4',
      book: ALL_BOOKS[3],
      lastPlayed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      progress: 80,
      duration: 4800,
    },
  ]);

  const clearHistory = () => {
    Alert.alert(
      '清除历史',
      '确定要清除所有播放历史吗？',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '清除', 
          style: 'destructive', 
          onPress: () => {
            setHistory([]);
            showToast({ type: 'success', message: '已清除播放历史' });
          }
        },
      ]
    );
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;

    return `${Math.floor(diffInDays / 7)}周前`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const renderHistoryItem = ({item}: {item: PlayHistoryItem}) => (
    <TouchableOpacity style={styles.historyItem} activeOpacity={tokens.opacity.active}>
      <CachedImage source={{uri: getBookCoverUrl(item.book)}} style={styles.historyCover} />
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.book.title}
        </Text>
        <Text style={styles.historyAuthor} numberOfLines={1}>
          {item.book.author}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${item.progress}%`}
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress}% · {formatDuration(item.duration)}
          </Text>
        </View>

        <Text style={styles.historyTime}>
          上次播放: {formatTimeAgo(item.lastPlayed)}
        </Text>
      </View>

      <TouchableOpacity style={styles.moreButton} activeOpacity={tokens.opacity.active}>
        <MaterialIcons name="more-vert" size={20} color={tokens.colors.text.tertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>播放历史</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory} activeOpacity={tokens.opacity.active}>
              <Text style={styles.clearText}>清除</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 历史列表 */}
        {history.length === 0 ? (
          <EmptyState
            icon="history"
            title="暂无播放历史"
            subtitle="开始听书后，播放记录将显示在这里"
          />
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  headerTitle: {
    fontSize: tokens.typography.h3,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  clearText: {
    color: tokens.colors.primary,
    fontSize: tokens.typography.caption,
  },
  historyList: {
    flex: 1,
    padding: tokens.spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  historyCover: {
    width: 80,
    height: 100,
    borderRadius: tokens.radius.sm,
  },
  historyInfo: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  historyAuthor: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.sm,
  },
  progressContainer: {
    marginBottom: tokens.spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: tokens.colors.border.default,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
  },
  historyTime: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
  },
  moreButton: {
    padding: tokens.spacing.sm,
  },
});

export default HistoryScreen;