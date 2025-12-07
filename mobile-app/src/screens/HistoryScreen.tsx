import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {Book} from '../types';
import {ALL_BOOKS, getBookCoverUrl, getBookPlayCount} from '../data/mockData';

interface PlayHistoryItem {
  id: string;
  book: Book;
  lastPlayed: Date;
  progress: number; // 播放进度百分比
  duration: number; // 总时长
}

const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<PlayHistoryItem[]>([
    {
      id: '1',
      book: ALL_BOOKS[0],
      lastPlayed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      progress: 65,
      duration: 3600, // 1小时
    },
    {
      id: '2',
      book: ALL_BOOKS[1],
      lastPlayed: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
      progress: 30,
      duration: 4200, // 1小时10分钟
    },
    {
      id: '3',
      book: ALL_BOOKS[2],
      lastPlayed: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
      progress: 100,
      duration: 3000, // 50分钟
    },
    {
      id: '4',
      book: ALL_BOOKS[3],
      lastPlayed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      progress: 80,
      duration: 4800, // 1小时20分钟
    },
  ]);

  const clearHistory = () => {
    Alert.alert(
      '清除历史',
      '确定要清除所有播放历史吗？',
      [
        {text: '取消', style: 'cancel'},
        {text: '清除', style: 'destructive', onPress: () => setHistory([])},
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
    <TouchableOpacity style={styles.historyItem}>
      <Image source={{uri: getBookCoverUrl(item.book)}} style={styles.historyCover} />
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

      <TouchableOpacity style={styles.moreButton}>
        <MaterialIcons name="more-vert" size={20} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="history" size={64} color="#ddd" />
      <Text style={styles.emptyStateTitle}>暂无播放历史</Text>
      <Text style={styles.emptyStateSubtitle}>
        开始听书后，播放记录将显示在这里
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>播放历史</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 历史列表 */}
      {history.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          style={styles.historyList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCover: {
    width: 80,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  moreButton: {
    padding: 8,
  },
});

export default HistoryScreen;