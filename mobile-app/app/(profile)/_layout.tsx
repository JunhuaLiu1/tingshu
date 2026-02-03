import React from 'react';
import { Stack } from 'expo-router';
import { tokens } from '../../src/theme/tokens';

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
      <Stack.Screen name="profile/edit" options={{ title: '编辑资料' }} />
      <Stack.Screen name="profile/account" options={{ title: '账号管理' }} />
    </Stack>
  );
}

