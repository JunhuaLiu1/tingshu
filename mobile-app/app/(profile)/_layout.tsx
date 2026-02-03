import React from 'react';
import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../../src/theme/tokens';

function HeaderExitButton() {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      activeOpacity={tokens.opacity.active}
      accessibilityRole="button"
      accessibilityLabel="退出"
      style={{ padding: tokens.spacing.xs, marginLeft: tokens.spacing.sm }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialIcons name="close" size={24} color={tokens.colors.text.primary} />
    </TouchableOpacity>
  );
}

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: tokens.colors.surface },
        headerTitleStyle: { color: tokens.colors.text.primary },
        headerTintColor: tokens.colors.text.primary,
      }}
    >
      <Stack.Screen
        name="profile/edit"
        options={{
          title: '编辑资料',
          headerLeft: () => <HeaderExitButton />,
        }}
      />
      <Stack.Screen
        name="profile/account"
        options={{
          title: '账号管理',
          headerLeft: () => <HeaderExitButton />,
        }}
      />
      <Stack.Screen
        name="profile/about"
        options={{
          title: '关于我们',
          headerLeft: () => <HeaderExitButton />,
        }}
      />
    </Stack>
  );
}
