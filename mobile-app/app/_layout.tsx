import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/contexts/ToastContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}