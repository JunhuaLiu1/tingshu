import React, { useState, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import CachedImage from '../components/common/CachedImage';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAppSettings } from '../hooks/useAppSettings';
import { getAppVersion } from '../utils/appVersion';
import { useAuth } from '../contexts/AuthContext';
import { audioCache } from '../services/audioCache';
import { useAvatarPicker } from '../hooks/useAvatarPicker';

const ProfileScreen: React.FC = () => {
  const { showToast } = useToast();
  const { user, logout, isLoading: authLoading } = useAuth();
  const {
    profile,
    stats,
    isLoading,
    error,
    loadProfile,
    updateProfile,
  } = useUserProfile();

  const {
    settings,
    updateSettings,
  } = useAppSettings();

  const { pickAvatar, isLoading: avatarLoading } = useAvatarPicker();

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
        onPress: async () => {
          try {
            await audioCache.clearCache();
            await loadProfile();
            showToast({ type: 'success', message: '缓存已清除' });
          } catch {
            showToast({ type: 'error', message: '清除失败' });
          }
        },
      },
    ]);
  }, [showToast, loadProfile]);

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
    showToast({ type: 'info', message: '功能开发中' });
  }, [showToast]);

  // 渲染菜单项
  const renderMenuItem = useCallback((
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    isLast: boolean = false
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        <MaterialIcons name={icon as any} size={22} color={tokens.colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={tokens.colors.text.tertiary} />
    </TouchableOpacity>
  ), []);

  // 渲染设置项
  const renderSettingsItem = useCallback((
    icon: string,
    title: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isLast: boolean = false
  ) => (
    <View style={[styles.menuItem, isLast && styles.menuItemLast]}>
      <View style={styles.menuIconContainer}>
        <MaterialIcons name={icon as any} size={22} color={tokens.colors.primary} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: tokens.colors.border.default, true: tokens.colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#fff' : tokens.colors.surface}
        style={{ transform: [{ scale: 0.8 }] }}
      />
    </View>
  ), []);

  // 渲染分组
  const renderSection = useCallback((title: string, children: React.ReactNode) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.cardContainer}>
        {children}
      </View>
    </View>
  ), []);

  if (isLoading || authLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <EmptyState
            icon="person-outline"
            title="未登录"
            subtitle="请先登录以查看个人中心"
            actionText="去登录"
            onActionPress={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {/* 顶部背景 */}
        <View style={styles.headerBackground} />

        {/* 用户信息卡片 */}
        <SafeAreaView style={{ paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={pickAvatar}
              activeOpacity={0.8}
              disabled={avatarLoading}
            >
              <CachedImage
                source={{ uri: profile?.avatar || 'https://picsum.photos/200/200?random=avatar' }}
                style={styles.avatar}
              />
              <View style={styles.editBadge}>
                <MaterialIcons name="edit" size={12} color="#fff" />
              </View>
              {avatarLoading && (
                <View style={styles.avatarLoadingOverlay}>
                  <Text style={styles.avatarLoadingText}>...</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{profile?.username || profile?.user_id || user?.user_id || '用户'}</Text>
              <Text style={styles.joinDate}>
                {profile?.created_at ? `加入时间 ${formatDate(profile.created_at)}` : ' '}
              </Text>
            </View>
          </View>

          {/* 统计数据卡片 */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.booksPlayed || 0}</Text>
              <Text style={styles.statLabel}>已听书籍</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round((stats?.totalHours || 0) * 10) / 10}</Text>
              <Text style={styles.statLabel}>听书时长(h)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.favorites || 0}</Text>
              <Text style={styles.statLabel}>收藏书籍</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* 菜单区域 */}
        <View style={styles.menuContainer}>
          {renderSection('个人设置', (
            <>
              {renderMenuItem('person', '编辑资料', profile?.username, () => handleMenuPress('ProfileEdit'))}
              {renderMenuItem('lock', '账号管理', '修改密码', () => handleMenuPress('ProfileEdit'), true)}
            </>
          ))}

          {renderSection('播放设置', (
            <>
              {renderSettingsItem('play-arrow', '自动播放下一集', settings.autoPlay, (v) => updateSettings({ autoPlay: v }))}
              {renderSettingsItem('wifi', '仅WiFi下下载', settings.downloadOnlyWifi, (v) => updateSettings({ downloadOnlyWifi: v }))}
              {renderSettingsItem('notifications', '推送通知', settings.notifications, (v) => updateSettings({ notifications: v }), true)}
            </>
          ))}

          {renderSection('其他', (
            <>
              {renderMenuItem('file-download', '下载管理', `${stats?.downloads || 0}个文件`, () => handleMenuPress('Downloads'))}
              {renderMenuItem('cleaning-services', '清除缓存', stats?.cacheSize || '缓存大小', handleClearCache)}
              {renderMenuItem('feedback', '意见反馈', undefined, () => handleMenuPress('Feedback'))}
              {renderMenuItem('info', '关于我们', `v${getAppVersion()}`, () => handleMenuPress('Help'), true)}
            </>
          ))}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>

          <View style={styles.footerSpace} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
  },
  loadingText: {
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.md,
  },

  // Header Style
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(255, 107, 53, 0.08)', // Primary color subtle tint
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: tokens.spacing.md,
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: tokens.colors.surface,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: tokens.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.surface,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: tokens.typography.h2,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: tokens.typography.small,
    color: tokens.colors.text.tertiary,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
    paddingVertical: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    ...tokens.shadows.md,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    color: tokens.colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: tokens.colors.border.light,
  },

  // Menu Sections
  menuContainer: {
    padding: tokens.spacing.lg,
  },
  sectionContainer: {
    marginBottom: tokens.spacing.lg,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  cardContainer: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    ...tokens.shadows.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
    height: 56,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  menuTitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 13,
    color: tokens.colors.text.tertiary,
  },

  // Logout Button
  logoutBtn: {
    marginTop: tokens.spacing.md,
    marginHorizontal: tokens.spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: tokens.colors.text.tertiary,
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.medium,
  },
  footerSpace: {
    height: 40,
  }
});

export default ProfileScreen;
