import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Book } from '../types';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import EmptyState from '../components/common/EmptyState';
import CachedImage from '../components/common/CachedImage';
import { useToast } from '../contexts/ToastContext';
import { usePlayHistory, PlayHistoryItem } from '../hooks/usePlayHistory';

const ITEM_HEIGHT = 120;

const HistoryScreen: React.FC = () => {
  const { showToast } = useToast();

  const {
    history,
    isLoading,
    error,
    loadHistory,
    removeHistory,
    clearHistory
  } = usePlayHistory();

  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHistory();
      showToast({ type: 'success', message: '已刷新' });
    } catch (err) {
      showToast({ type: 'error', message: '刷新失败' });
    } finally {
      setRefreshing(false);
    }
  }, [loadHistory, showToast]);

  // 清空历史确认
  const handleClearHistory = useCallback(() => {
    Alert.alert(
      '清除历史',
      '确定要清除所有播放历史吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              showToast({ type: 'success', message: '已清除播放历史' });
            } catch (err) {
              showToast({ type: 'error', message: '清除失败' });
            }
          }
        }
      ]
    );
  }, [clearHistory, showToast]);

  // 更多按钮操作
  const handleMorePress = useCallback((item: PlayHistoryItem) => {
    Alert.alert('操作', item.title, [
      {
        text: '删除记录',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeHistory(item.id);
            showToast({ type: 'success', message: '已删除' });
          } catch (err) {
            showToast({ type: 'error', message: '删除失败' });
          }
        }
      },
      {
        text: '收藏',
        onPress: () => {
          showToast({ type: 'info', message: '已收藏' });
        }
      },
      { text: '取消', style: 'cancel' }
    ]);
  }, [removeHistory, showToast]);

  // 长按删除单条
  const handleLongPress = useCallback((item: PlayHistoryItem) => {
    Alert.alert('删除记录', `确定删除 "${item.title}" 吗？`, [
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeHistory(item.id);
            showToast({ type: 'success', message: '已删除' });
          } catch (err) {
            showToast({ type: 'error', message: '删除失败' });
          }
        }
      },
      { text: '取消', style: 'cancel' }
    ]);
  }, [removeHistory, showToast]);

  // 格式化时间
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;

    return `${Math.floor(diffInDays / 7)}周前`;
  }, []);

  // 格式化时长
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }, []);

  // 排序逻辑
  const sortedHistory = useMemo(() => {
    const sorted = [...history];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());
      case 'progress':
        return sorted.sort((a, b) => b.progress - a.progress);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [history, sortBy]);

  // 渲染列表头部
  const renderListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <Text style={styles.resultCount}>
        共 {history.length} 条播放记录
      </Text>
      {history.length > 0 && (
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
              最近
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'progress' && styles.sortButtonActive]}
            onPress={() => setSortBy('progress')}
          >
            <Text style={[styles.sortText, sortBy === 'progress' && styles.sortTextActive]}>
              进度
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'title' && styles.sortButtonActive]}
            onPress={() => setSortBy('title')}
          >
            <Text style={[styles.sortText, sortBy === 'title' && styles.sortTextActive]}>
              标题
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [history.length, sortBy]);

  // 渲染历史项
  const renderHistoryItem = useCallback(({ item }: { item: PlayHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      activeOpacity={tokens.opacity.active}
      onPress={() => router.push({
        pathname: '/player',
        params: {
          bookId: item.bookId.toString(),
          episodeId: item.episodeId?.toString(),
          progress: item.progress.toString()
        }
      })}
      onLongPress={() => handleLongPress(item)}
    >
      <CachedImage source={{ uri: item.coverUrl }} style={styles.historyCover} />
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.historyAuthor} numberOfLines={1}>
          {item.author}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.progress}%` }
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

      <TouchableOpacity
        style={styles.moreButton}
        activeOpacity={tokens.opacity.active}
        onPress={() => handleMorePress(item)}
      >
        <MaterialIcons name="more-vert" size={20} color={tokens.colors.text.tertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleLongPress, handleMorePress, formatDuration, formatTimeAgo]);

  // 渲染错误状态
  const renderErrorState = useCallback(() => (
    <EmptyState
      icon="error-outline"
      title="加载失败"
      subtitle={error || '加载历史记录失败，请重试'}
      actionText="重试"
      onActionPress={loadHistory}
    />
  ), [error, loadHistory]);

  // 渲染空状态
  const renderEmptyState = useCallback(() => (
    <EmptyState
      icon="history"
      title="暂无播放历史"
      subtitle="开始听书后，播放记录将显示在这里"
      actionText="去搜索"
      onActionPress={() => router.push('/search')}
    />
  ), []);

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>播放历史</Text>
          {sortedHistory.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory} activeOpacity={tokens.opacity.active}>
              <Text style={styles.clearText}>清除</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 内容区域 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : error ? (
          renderErrorState()
        ) : sortedHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={sortedHistory}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            refreshing={refreshing}
            onRefresh={onRefresh}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
            ListHeaderComponent={renderListHeader}
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
    fontWeight: tokens.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text.secondary,
  },
  historyList: {
    flex: 1,
    padding: tokens.spacing.md,
  },
  listHeader: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  resultCount: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.sm,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  sortButton: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface,
  },
  sortButtonActive: {
    backgroundColor: tokens.colors.primary,
  },
  sortText: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.secondary,
  },
  sortTextActive: {
    color: tokens.colors.background,
    fontWeight: tokens.fontWeight.medium,
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
