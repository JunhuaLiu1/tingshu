import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { tokens } from '../../src/theme/tokens';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function RegisterScreen() {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!userId.trim() || !email.trim() || !password || !confirmPassword) {
      setError('请填写完整信息');
      return false;
    }
    if (!/^\d{7}$/.test(userId.trim())) {
      setError('用户ID必须是7位数字');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('邮箱格式不正确');
      return false;
    }
    if (password.length < 8) {
      setError('密码长度至少8位');
      return false;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('密码需包含字母、数字和特殊字符');
      return false;
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await authApi.register({
        user_id: userId.trim(),
        email: email.trim(),
        password,
      });
      if (res.code === 200 && res.data) {
        await login(res.data.user, res.data.session);
        router.replace('/(tabs)/profile');
      } else {
        setError(getErrorMessage(res.message));
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'AUTH_CREATE_FAILED';
      setError(getErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      INVALID_INPUT: '输入格式不正确',
      INVALID_USER_ID: '用户ID必须是7位数字',
      WEAK_PASSWORD: '密码需包含字母、数字和特殊字符',
      USER_ID_EXISTS: '该用户ID已被注册',
      EMAIL_EXISTS: '该邮箱已被注册',
      AUTH_CREATE_FAILED: '注册失败，请重试',
      PROFILE_CREATE_FAILED: '创建用户资料失败',
    };
    return messages[code] || '注册失败，请重试';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>注册</Text>
          <Text style={styles.subtitle}>创建你的听书账号</Text>

          <TextInput
            style={styles.input}
            placeholder="用户ID (7位数字)"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={userId}
            onChangeText={setUserId}
            keyboardType="number-pad"
            maxLength={7}
          />

          <TextInput
            style={styles.input}
            placeholder="邮箱"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="密码 (至少8位，含字母+数字+特殊字符)"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="确认密码"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>注册</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>已有账号？去登录</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: tokens.spacing.lg,
    justifyContent: 'center',
  },
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
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
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
  buttonDisabled: {
    opacity: tokens.opacity.disabled,
  },
  buttonText: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.body,
    fontWeight: tokens.fontWeight.semibold,
  },
  link: {
    color: tokens.colors.primary,
    fontSize: tokens.typography.caption,
    textAlign: 'center',
    marginTop: tokens.spacing.lg,
  },
  backButton: {
    marginTop: tokens.spacing.xl,
    alignItems: 'center',
  },
  backText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.caption,
  },
});
