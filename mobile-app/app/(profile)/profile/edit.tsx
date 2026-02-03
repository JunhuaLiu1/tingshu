import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../../../src/theme/tokens';
import { layoutStyles } from '../../../src/theme/styles';
import CachedImage from '../../../src/components/common/CachedImage';
import EmptyState from '../../../src/components/common/EmptyState';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useUserProfile } from '../../../src/hooks/useUserProfile';
import { useAvatarPicker } from '../../../src/hooks/useAvatarPicker';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProfileEditScreen() {
  const { user } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const { pickAvatar, isLoading: avatarLoading } = useAvatarPicker();

  const displayUserID = useMemo(() => profile?.user_id || user?.user_id || '-', [profile?.user_id, user?.user_id]);
  const displayEmail = useMemo(() => profile?.email || user?.email || '-', [profile?.email, user?.email]);
  const displayAvatar = useMemo(
    () => profile?.avatar || 'https://picsum.photos/200/200?random=avatar',
    [profile?.avatar]
  );

  if (!user) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={styles.center}>
          <EmptyState
            icon="person-outline"
            title="未登录"
            subtitle="请先登录后再编辑资料"
            actionText="去登录"
            onActionPress={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>头像</Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <CachedImage source={{ uri: displayAvatar }} style={styles.avatar} />
              {avatarLoading && (
                <View style={styles.avatarLoading}>
                  <Text style={styles.avatarLoadingText}>...</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, (avatarLoading || isLoading) && styles.actionBtnDisabled]}
              onPress={pickAvatar}
              disabled={avatarLoading || isLoading}
              activeOpacity={tokens.opacity.active}
            >
              <MaterialIcons name="photo-camera" size={18} color={tokens.colors.text.inverse} />
              <Text style={styles.actionBtnText}>更换头像</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>更换头像会自动同步到服务器。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>账号信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>用户ID</Text>
            <Text style={styles.value}>{displayUserID}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>邮箱</Text>
            <Text style={styles.value}>{displayEmail}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>加入时间</Text>
            <Text style={styles.value}>{formatDate(profile?.created_at)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    ...tokens.shadows.sm,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: tokens.colors.border.light,
    backgroundColor: tokens.colors.background,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: tokens.fontWeight.bold,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
  },
  actionBtnDisabled: {
    opacity: tokens.opacity.disabled,
  },
  actionBtnText: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.caption,
    fontWeight: tokens.fontWeight.semibold,
  },
  helpText: {
    marginTop: tokens.spacing.sm,
    color: tokens.colors.text.tertiary,
    fontSize: tokens.typography.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
  },
  label: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.caption,
  },
  value: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.medium,
    maxWidth: '70%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border.light,
  },
});

