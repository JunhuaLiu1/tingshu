import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_SETTINGS_KEY = 'app_settings';

// 应用设置接口
export interface AppSettings {
  notifications: boolean;      // 推送通知
  autoPlay: boolean;           // 自动播放下一集
  downloadOnlyWifi: boolean;   // 仅WiFi下下载
}

// Hook 返回类型
interface UseAppSettingsReturn {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

/**
 * 应用设置 Hook
 * 管理应用设置并自动持久化到 AsyncStorage
 */
export const useAppSettings = (): UseAppSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    autoPlay: true,
    downloadOnlyWifi: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 默认设置
  const defaultSettings: AppSettings = {
    notifications: true,
    autoPlay: true,
    downloadOnlyWifi: false,
  };

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      } else {
        // 首次使用，保存默认设置
        await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(defaultSettings));
      }
    } catch (err) {
      console.error('Failed to load app settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新设置
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };

      setSettings(updatedSettings);

      // 自动保存到 AsyncStorage
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (err) {
      console.error('Failed to update app settings:', err);
      throw err;
    }
  }, [settings]);

  // 重置设置
  const resetSettings = useCallback(async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch (err) {
      console.error('Failed to reset app settings:', err);
      throw err;
    }
  }, []);

  // 组件挂载时加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  };
};
