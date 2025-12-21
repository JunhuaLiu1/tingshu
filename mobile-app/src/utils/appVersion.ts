/**
 * 应用版本工具函数
 * 动态获取应用版本号
 */

// 检查是否在 Expo 环境中
let version = '1.0.0';

try {
  // 尝试从 expo-constants 获取版本
  const Constants = require('expo-constants');
  if (Constants?.expoConfig?.version) {
    version = Constants.expoConfig.version;
  }
} catch (err) {
  // 如果不在 Expo 环境中，使用默认版本
  console.log('expo-constants not available, using default version');
}

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
