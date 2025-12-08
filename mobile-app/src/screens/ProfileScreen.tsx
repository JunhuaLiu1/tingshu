import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {User} from '../types';
import { tokens } from '../theme/tokens';
import { layoutStyles } from '../theme/styles';
import CachedImage from '../components/common/CachedImage';
import { useToast } from '../contexts/ToastContext';

const ProfileScreen: React.FC = () => {
  const { showToast } = useToast();
  const [user] = useState<User>({
    id: 1,
    username: 'booklover',
    email: 'booklover@example.com',
    avatar: 'https://picsum.photos/200/200?random=avatar',
    phone: '138****8888',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  });

  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [downloadOnlyWifi, setDownloadOnlyWifi] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账号吗？',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '退出', 
          style: 'destructive', 
          onPress: () => {
            showToast({ type: 'success', message: '已退出登录' });
            console.log('User logged out');
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert('清除缓存', '确定要清除所有缓存吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '清除', 
        style: 'destructive', 
        onPress: () => {
          showToast({ type: 'success', message: '缓存已清除' });
          console.log('Cache cleared');
        }
      },
    ]);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <CachedImage
        source={{uri: user.avatar || 'https://picsum.photos/200/200?random=avatar'}}
        style={styles.avatar}
      />
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.joinDate}>加入时间: {formatDate(user.created_at)}</Text>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>127</Text>
        <Text style={styles.statLabel}>已听书籍</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>856</Text>
        <Text style={styles.statLabel}>听书时长(小时)</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>42</Text>
        <Text style={styles.statLabel}>收藏书籍</Text>
      </View>
    </View>
  );

  const renderMenuItem = (
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
  );

  const renderSettingsItem = (
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
        trackColor={{false: tokens.colors.border.default, true: tokens.colors.primary}}
        thumbColor={tokens.colors.surface}
      />
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 用户信息头部 */}
        {renderProfileHeader()}

        {/* 统计信息 */}
        {renderStatsSection()}

        {/* 个人信息设置 */}
        {renderSection('个人设置', (
          <>
            {renderMenuItem('person', '编辑资料', user.username)}
            {renderMenuItem('account-circle', '账号管理', '设置登录密码')}
            {renderMenuItem('notifications', '消息通知', '你有3条新消息')}
          </>
        ))}

        {/* 播放设置 */}
        {renderSection('播放设置', (
          <>
            {renderSettingsItem('play-arrow', '自动播放下一集', autoPlay, setAutoPlay)}
            {renderSettingsItem('wifi', '仅WiFi下下载', downloadOnlyWifi, setDownloadOnlyWifi)}
            {renderSettingsItem('notifications', '推送通知', notifications, setNotifications)}
          </>
        ))}

        {/* 其他功能 */}
        {renderSection('其他', (
          <>
            {renderMenuItem('favorite', '我的收藏', '42本书籍')}
            {renderMenuItem('download', '下载管理', '15个文件')}
            {renderMenuItem('history', '清除缓存', '缓存大小: 128MB', handleClearCache)}
            {renderMenuItem('feedback', '意见反馈')}
            {renderMenuItem('info', '关于我们', '版本 1.0.0')}
            {renderMenuItem('help', '帮助与支持')}
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