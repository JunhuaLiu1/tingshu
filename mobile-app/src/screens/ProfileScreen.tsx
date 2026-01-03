import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { User } from '../types';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import CachedImage from '../components/common/CachedImage';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAppSettings } from '../hooks/useAppSettings';
import { getAppVersion } from '../utils/appVersion';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { showToast } = useToast();
  const { user, logout, isLoading: authLoading } = useAuth();

  // 使用 Hook 获取用户数据和设置
  const {
    profile,
    stats,
    isLoading,
    error,
    loadProfile,
  } = useUserProfile();

  const {
    settings,
    updateSettings,
  } = useAppSettings();

  const [refreshing, setRefreshing] = useState(false);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile();
      showToast({ type: 'success', message: '已刷新' });
    } catch (err) {
      showToast({ type: 'error', message: '刷新失败' });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile, showToast]);

  // 退出登录
  const handleLogout = useCallback(() => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账号吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast({ type: 'success', message: '已退出登录' });
          }
        },
      ]
    );
  }, [showToast, logout]);

  // 清除缓存
  const handleClearCache = useCallback(() => {
    Alert.alert('清除缓存', '确定要清除所有缓存吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除',
        style: 'destructive',
        onPress: () => {
          showToast({ type: 'success', message: '缓存已清除' });
          console.log('Cache cleared');
          // 这里可以添加实际的清除缓存逻辑
        }
      },
    ]);
  }, [showToast]);

  // 格式化日期
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // 菜单项点击处理
  const handleMenuPress = useCallback((screen: string) => {
    // 检查屏幕是否存在，如果不存在则显示提示
    const availableScreens = ['ProfileEdit', 'Favorites', 'Downloads', 'Feedback', 'Help'];
    if (availableScreens.includes(screen)) {
      showToast({ type: 'info', message: '功能开发中' });
    } else {
      showToast({ type: 'info', message: '功能开发中' });
    }
  }, [showToast]);

  // 渲染用户信息头部
  const renderProfileHeader = useCallback(() => (
    <View style={styles.profileHeader}>
      <CachedImage
        source={{ uri: profile?.avatar || 'https://picsum.photos/200/200?random=avatar' }}
        style={styles.avatar}
      />
      <Text style={styles.username}>{user?.user_id || profile?.username || '用户'}</Text>
      <Text style={styles.email}>{user?.email || profile?.email || ''}</Text>
      <Text style={styles.joinDate}>
        加入时间: {profile ? formatDate(profile.created_at) : ''}
      </Text>
    </View>
  ), [profile, user, formatDate]);

  // 渲染统计信息
  const renderStatsSection = useCallback(() => (
    <View style={styles.statsSection}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.booksPlayed || 0}</Text>
        <Text style={styles.statLabel}>已听书籍</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.totalHours || 0}</Text>
        <Text style={styles.statLabel}>听书时长(小时)</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.favorites || 0}</Text>
        <Text style={styles.statLabel}>收藏书籍</Text>
      </View>
    </View>
  ), [stats]);

  // 渲染菜单项
  const renderMenuItem = useCallback((
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={tokens.opacity.active}
    >
      <MaterialIcons name={icon} size={24} color={tokens.colors.text.secondary} />
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={tokens.colors.text.tertiary} />
    </TouchableOpacity>
  ), []);

  // 渲染设置项
  const renderSettingsItem = useCallback((
    icon: string,
    title: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.menuItem}>
      <MaterialIcons name={icon} size={24} color={tokens.colors.text.secondary} />
      <Text style={styles.menuTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: tokens.colors.border.default, true: tokens.colors.primary }}
        thumbColor={tokens.colors.surface}
      />
    </View>
  ), []);

  // 渲染分组
  const renderSection = useCallback((title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  ), []);

  // 渲染错误状态
  const renderErrorState = useCallback(() => (
    <EmptyState
      icon="error-outline"
      title="加载失败"
      subtitle={error || '加载用户资料失败'}
      actionText="重试"
      onActionPress={loadProfile}
    />
  ), [error, loadProfile]);

  // 渲染未登录状态
  const renderNotLoginState = useCallback(() => (
    <EmptyState
      icon="person-outline"
      title="未登录"
      subtitle="请先登录以查看个人中心"
      actionText="去登录"
      onActionPress={() => router.push('/(auth)/login')}
    />
  ), []);

  // 渲染加载状态
  const renderLoadingState = useCallback(() => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  ), []);

  // 如果正在加载
  if (isLoading || authLoading) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={styles.container}>
          {renderLoadingState()}
        </View>
      </SafeAreaView>
    );
  }

  // 如果有错误
  if (error) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={styles.container}>
          {renderErrorState()}
        </View>
      </SafeAreaView>
    );
  }

  // 如果未登录
  if (!user) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={styles.container}>
          {renderNotLoginState()}
        </View>
      </SafeAreaView>
    );
  }

  // 正常渲染
  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tokens.colors.primary]}
            tintColor={tokens.colors.primary}
          />
        }
      >
        {/* 用户信息头部 */}
        {renderProfileHeader()}

        {/* 统计信息 */}
        {renderStatsSection()}

        {/* 个人信息设置 */}
        {renderSection('个人设置', (
          <>
            {renderMenuItem('person', '编辑资料', profile.username, () => handleMenuPress('ProfileEdit'))}
            {renderMenuItem('account-circle' as any, '账号管理', '设置登录密码', () => handleMenuPress('ProfileEdit'))}
            {renderMenuItem('notifications', '消息通知',
              stats?.messages ? `你有${stats.messages}条新消息` : '暂无新消息',
              () => handleMenuPress('ProfileEdit')
            )}
          </>
        ))}

        {/* 播放设置 */}
        {renderSection('播放设置', (
          <>
            {renderSettingsItem('play-arrow' as any, '自动播放下一集', settings.autoPlay, (value) => updateSettings({ autoPlay: value }))}
            {renderSettingsItem('wifi', '仅WiFi下下载', settings.downloadOnlyWifi, (value) => updateSettings({ downloadOnlyWifi: value }))}
            {renderSettingsItem('notifications', '推送通知', settings.notifications, (value) => updateSettings({ notifications: value }))}
          </>
        ))}

        {/* 其他功能 */}
        {renderSection('其他', (
          <>
            {renderMenuItem('favorite', '我的收藏', `${stats?.favorites || 0}本书籍`, () => handleMenuPress('Favorites'))}
            {renderMenuItem('download', '下载管理', `${stats?.downloads || 0}个文件`, () => handleMenuPress('Downloads'))}
            {renderMenuItem('history', '清除缓存', stats?.cacheSize || '缓存大小', handleClearCache)}
            {renderMenuItem('feedback', '意见反馈', undefined, () => handleMenuPress('Feedback'))}
            {renderMenuItem('info', '关于我们', `版本 ${getAppVersion()}`, () => handleMenuPress('Help'))}
            {renderMenuItem('help', '帮助与支持', undefined, () => handleMenuPress('Help'))}
          </>
        ))}

        {/* 退出登录按钮 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={tokens.opacity.active}
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
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
  profileHeader: {
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    paddingTop: tokens.spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.full,
    marginBottom: tokens.spacing.md,
  },
  username: {
    fontSize: tokens.typography.h2,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    marginTop: tokens.spacing.md,
    paddingVertical: tokens.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: tokens.typography.h1,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginTop: tokens.spacing.lg,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  menuContent: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  menuTitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
  },
  menuSubtitle: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
    marginTop: 2,
  },
  logoutButton: {
    margin: tokens.spacing.lg,
    marginVertical: tokens.spacing.xxl,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  logoutText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.primary,
    fontWeight: tokens.fontWeight.semibold,
  },
});

export default ProfileScreen;