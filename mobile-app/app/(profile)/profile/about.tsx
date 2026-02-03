import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { tokens } from '../../../src/theme/tokens';
import { layoutStyles } from '../../../src/theme/styles';
import { getVersionInfo } from '../../../src/utils/appVersion';

type InfoRowProps = {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
};

function InfoRow({ icon, label, value, onPress, isLast }: InfoRowProps) {
  const content = (
    <>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <MaterialIcons name={icon as any} size={20} color={tokens.colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
        {onPress ? (
          <MaterialIcons name="chevron-right" size={18} color={tokens.colors.text.tertiary} />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, isLast && styles.rowLast]}
        onPress={onPress}
        activeOpacity={tokens.opacity.active}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      {content}
    </View>
  );
}

export default function AboutScreen() {
  const versionInfo = useMemo(() => getVersionInfo(), []);
  const supportEmail = useMemo(() => process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '', []);
  const privacyUrl = useMemo(() => process.env.EXPO_PUBLIC_PRIVACY_URL || '', []);

  const appName = useMemo(() => Constants?.expoConfig?.name || '听书', []);

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logo}>
            <MaterialIcons name="headphones" size={28} color="#fff" />
          </View>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.version}>
            v{versionInfo.version} ({versionInfo.environment})
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>产品介绍</Text>
          <Text style={styles.paragraph}>
            这是一个专注于“听书体验”的应用：搜索、播放、历史与个人中心等功能持续完善中。
          </Text>
          <Text style={styles.paragraph}>
            若你在使用中遇到问题，欢迎通过反馈渠道告诉我们，我们会尽快跟进。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>应用信息</Text>
          <InfoRow icon="tag" label="版本号" value={`v${versionInfo.version}`} />
          <InfoRow icon="build" label="构建号" value={versionInfo.buildNumber} />
          <InfoRow icon="settings" label="运行环境" value={versionInfo.environment} isLast />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>联系我们</Text>
          <InfoRow
            icon="feedback"
            label="反馈邮箱"
            value={supportEmail || '未配置'}
            onPress={supportEmail ? () => openLink(`mailto:${supportEmail}`) : undefined}
          />
          <InfoRow
            icon="policy"
            label="隐私政策"
            value={privacyUrl ? '打开链接' : '未配置'}
            onPress={privacyUrl ? () => openLink(privacyUrl) : undefined}
            isLast
          />
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} {appName} · All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.md,
    marginBottom: tokens.spacing.md,
  },
  appName: {
    fontSize: 22,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  version: {
    marginTop: 6,
    fontSize: 12,
    color: tokens.colors.text.tertiary,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    ...tokens.shadows.sm,
    marginBottom: tokens.spacing.lg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.md,
  },
  paragraph: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
    lineHeight: 22,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowLabel: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 13,
    color: tokens.colors.text.tertiary,
    marginRight: 4,
    maxWidth: 160,
    textAlign: 'right',
  },
  footer: {
    textAlign: 'center',
    color: tokens.colors.text.tertiary,
    fontSize: 12,
    marginTop: tokens.spacing.sm,
  },
});
