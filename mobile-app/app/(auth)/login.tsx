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
} from 'react-native';
import { router } from 'expo-router';
import { tokens } from '../../src/theme/tokens';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!identifier.trim() || !password) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ identifier: identifier.trim(), password });
      if (res.code === 200 && res.data) {
        await login(res.data.user, res.data.session);
        router.replace('/(tabs)/profile');
      } else {
        setError(getErrorMessage(res.message));
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'AUTH_FAILED';
      setError(getErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      INVALID_INPUT: '输入格式不正确',
      USER_ID_NOT_FOUND: '用户ID不存在',
      AUTH_FAILED: '账号或密码错误',
    };
    return messages[code] || '登录失败，请重试';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>登录</Text>
        <Text style={styles.subtitle}>使用用户ID或邮箱登录</Text>

        <TextInput
          style={styles.input}
          placeholder="用户ID (7位数字) 或 邮箱"
          placeholderTextColor={tokens.colors.text.tertiary}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="密码"
          placeholderTextColor={tokens.colors.text.tertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>登录</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>没有账号？去注册</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  content: {
    flex: 1,
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
