import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {User} from '../types';

const ProfileScreen: React.FC = () => {
  // 模拟用户数据
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
        {text: '退出', style: 'destructive', onPress: () => {
          console.log('User logged out');
        }},
      ]
    );
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
      <Image
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
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color="#666" />
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  const renderSettingsItem = (
    icon: string,
    title: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.menuItem}>
      <MaterialIcons name={icon} size={24} color="#666" />
      <Text style={styles.menuTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#E0E0E0', true: '#FF6B35'}}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
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
    <SafeAreaView style={styles.safeArea}>
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
          {renderMenuItem('history', '清除缓存', '缓存大小: 128MB', () => {
            Alert.alert('清除缓存', '确定要清除所有缓存吗？', [
              {text: '取消', style: 'cancel'},
              {text: '清除', style: 'destructive', onPress: () => {
                console.log('Cache cleared');
              }},
            ]);
          })}
          {renderMenuItem('feedback', '意见反馈')}
          {renderMenuItem('info', '关于我们', '版本 1.0.0')}
          {renderMenuItem('help', '帮助与支持')}
        </>
      ))}

      {/* 退出登录按钮 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logoutButton: {
    margin: 24,
    marginVertical: 40,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default ProfileScreen;