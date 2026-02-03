import React, { useMemo, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../../../src/theme/tokens';
import { authApi } from '../../../src/services/api';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useToast } from '../../../src/contexts/ToastContext';
import EmptyState from '../../../src/components/common/EmptyState';

const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
};

export default function AccountManageScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isOldPasswordVisible, setIsOldPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const userHint = useMemo(() => user?.user_id || '', [user?.user_id]);

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      INVALID_INPUT: '输入格式不正确',
      WEAK_PASSWORD: '新密码需包含字母、数字和特殊字符（至少8位）',
      AUTH_FAILED: '原密码不正确',
      PROFILE_NOT_FOUND: '账号不存在',
      DATABASE_ERROR: '服务异常，请稍后重试',
      Unauthorized: '登录已过期，请重新登录',
    };
    return messages[code] || '修改失败，请重试';
  };

  const validateForm = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写完整信息');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('两次密码输入不一致');
      return false;
    }
    if (!isStrongPassword(newPassword)) {
      setError('新密码需包含字母、数字和特殊字符（至少8位）');
      return false;
    }
    if (oldPassword === newPassword) {
      setError('新密码不能与原密码相同');
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
      if (res.code === 200) {
        showToast({ type: 'success', message: '密码已更新' });
        router.back();
        return;
      }
      setError(getErrorMessage(res.message));
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'DATABASE_ERROR';
      setError(getErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <EmptyState
            icon="lock-outline"
            title="未登录"
            subtitle="请先登录后再管理账号"
            actionText="去登录"
            onActionPress={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.title}>修改密码</Text>
          <Text style={styles.subtitle}>{userHint ? `账号：${userHint}` : '为你的账号设置新密码'}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="原密码"
              placeholderTextColor={tokens.colors.text.tertiary}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={!isOldPasswordVisible}
              autoCorrect={false}
              spellCheck={false}
              textContentType="password"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setIsOldPasswordVisible(prev => !prev)}
              activeOpacity={tokens.opacity.active}
              accessibilityRole="button"
              accessibilityLabel={isOldPasswordVisible ? '隐藏原密码' : '显示原密码'}
            >
              <MaterialIcons
                name={isOldPasswordVisible ? 'visibility-off' : 'visibility'}
                size={20}
                color={tokens.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="新密码（至少8位，含字母+数字+特殊字符）"
              placeholderTextColor={tokens.colors.text.tertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!isNewPasswordVisible}
              autoCorrect={false}
              spellCheck={false}
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setIsNewPasswordVisible(prev => !prev)}
              activeOpacity={tokens.opacity.active}
              accessibilityRole="button"
              accessibilityLabel={isNewPasswordVisible ? '隐藏新密码' : '显示新密码'}
            >
              <MaterialIcons
                name={isNewPasswordVisible ? 'visibility-off' : 'visibility'}
                size={20}
                color={tokens.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="确认新密码"
              placeholderTextColor={tokens.colors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
              autoCorrect={false}
              spellCheck={false}
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setIsConfirmPasswordVisible(prev => !prev)}
              activeOpacity={tokens.opacity.active}
              accessibilityRole="button"
              accessibilityLabel={isConfirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}
            >
              <MaterialIcons
                name={isConfirmPasswordVisible ? 'visibility-off' : 'visibility'}
                size={20}
                color={tokens.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>确认修改</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>忘记密码？通过邮箱重置</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  flex: { flex: 1 },
  content: { flex: 1, padding: tokens.spacing.lg, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.spacing.lg },
  title: {
    fontSize: tokens.typography.h1,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  input: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.md,
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  inputContainer: { marginBottom: tokens.spacing.md },
  passwordInput: { paddingRight: tokens.spacing.xxl },
  passwordToggle: {
    position: 'absolute',
    right: tokens.spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.sm,
  },
  error: {
    color: tokens.colors.semantic.error,
    fontSize: tokens.typography.caption,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.md,
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  },
  buttonDisabled: { opacity: tokens.opacity.disabled },
  buttonText: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
  },
  forgotWrap: { marginTop: tokens.spacing.lg, alignItems: 'center' },
  forgotText: { color: tokens.colors.text.secondary, fontSize: tokens.typography.caption },
});

