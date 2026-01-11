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
  View,
} from 'react-native';
import { router } from 'expo-router';
import { tokens } from '../../src/theme/tokens';
import { authApi } from '../../src/services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSendCode = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('请输入绑定邮箱');
      return;
    }
    if (!isEmailValid(email)) {
      setError('邮箱格式不正确');
      return;
    }

    setSendingCode(true);
    try {
      const res = await authApi.requestPasswordReset({ email: email.trim() });
      if (res.code === 200) {
        setCodeSent(true);
        setInfo('验证码已生成，请查看后端日志');
      } else {
        setError(getErrorMessage(res.message));
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'RESET_CODE_FAILED';
      setError(getErrorMessage(msg));
    } finally {
      setSendingCode(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !code.trim() || !password || !confirmPassword) {
      setError('请填写完整信息');
      return;
    }
    if (!isEmailValid(email)) {
      setError('邮箱格式不正确');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('验证码需为6位数字');
      return;
    }
    if (password.length < 8) {
      setError('密码长度至少8位');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('密码需包含字母、数字和特殊字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setResetting(true);
    try {
      const res = await authApi.confirmPasswordReset({
        email: email.trim(),
        code: code.trim(),
        password,
      });
      if (res.code === 200) {
        alert('密码已重置，请使用新密码登录');
        router.replace('/(auth)/login');
      } else {
        setError(getErrorMessage(res.message));
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'RESET_PASSWORD_FAILED';
      setError(getErrorMessage(msg));
    } finally {
      setResetting(false);
    }
  };

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      INVALID_INPUT: '输入格式不正确',
      EMAIL_NOT_FOUND: '该邮箱未绑定账号',
      CODE_INVALID: '验证码错误',
      CODE_EXPIRED: '验证码已过期，请重新获取',
      WEAK_PASSWORD: '密码需包含字母、数字和特殊字符',
      RESET_CODE_FAILED: '验证码发送失败，请重试',
      RESET_PASSWORD_FAILED: '重置密码失败，请重试',
    };
    return messages[code] || '操作失败，请重试';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>找回密码</Text>
          <Text style={styles.subtitle}>使用绑定邮箱获取验证码</Text>

          <TextInput
            style={styles.input}
            placeholder="绑定邮箱"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            spellCheck={false}
            textContentType="emailAddress"
            autoComplete="email"
          />

          <View style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="验证码"
              placeholderTextColor={tokens.colors.text.tertiary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoCorrect={false}
              spellCheck={false}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
            <TouchableOpacity
              style={[styles.codeButton, sendingCode && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={sendingCode}
              activeOpacity={tokens.opacity.active}
            >
              {sendingCode ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.codeButtonText}>{codeSent ? '重新获取' : '获取验证码'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="新密码 (至少8位，含字母+数字+特殊字符)"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
            spellCheck={false}
            textContentType="newPassword"
            autoComplete="new-password"
          />

          <TextInput
            style={styles.input}
            placeholder="确认新密码"
            placeholderTextColor={tokens.colors.text.tertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCorrect={false}
            spellCheck={false}
            textContentType="newPassword"
            autoComplete="new-password"
          />

          {info ? <Text style={styles.info}>{info}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, resetting && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={resetting}
          >
            {resetting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>重置密码</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>返回登录</Text>
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
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  codeInput: {
    flex: 1,
    marginBottom: 0,
  },
  codeButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    marginLeft: tokens.spacing.sm,
  },
  codeButtonText: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.caption,
    fontWeight: tokens.fontWeight.semibold,
  },
  info: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.caption,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
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
