/**
 * 应用版本工具函数
 * 动态获取应用版本号
 */

import Constants from 'expo-constants';

// 检查是否在 Expo 环境中
const version = Constants?.expoConfig?.version || '1.0.0';

/**
 * 获取应用版本号
 * @returns {string} 版本号，例如 "1.0.0"
 */
export const getAppVersion = (): string => {
  return version;
};

/**
 * 获取完整的版本信息
 * @returns {object} 包含版本号的对象
 */
export const getVersionInfo = () => ({
  version: getAppVersion(),
  buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
  environment: process.env.NODE_ENV || 'production',
});

export default {
  getAppVersion,
  getVersionInfo,
};
