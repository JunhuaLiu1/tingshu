import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// 设计稿基准宽度
const BASE_WIDTH = 375;

// 屏幕尺寸判断
export const isSmallScreen = () => width < 375;
export const isMediumScreen = () => width >= 375 && width < 414;
export const isLargeScreen = () => width >= 414;

// 自适应缩放
export const scale = (size: number): number => {
  return (width / BASE_WIDTH) * size;
};

// 垂直缩放
export const verticalScale = (size: number): number => {
  const BASE_HEIGHT = 667;
  return (height / BASE_HEIGHT) * size;
};

// 适度缩放（介于 scale 和固定值之间）
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// 响应式间距
export const responsiveSpacing = (base: number): number => {
  if (isSmallScreen()) return base * 0.8;
  if (isLargeScreen()) return base * 1.1;
  return base;
};

// 设备类型判断
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// 获取屏幕尺寸
export const getScreenDimensions = () => ({
  width,
  height,
  isSmall: isSmallScreen(),
  isMedium: isMediumScreen(),
  isLarge: isLargeScreen(),
});

// 响应式字体大小
export const responsiveFontSize = (size: number): number => {
  if (isSmallScreen()) return size - 1;
  if (isLargeScreen()) return size + 1;
  return size;
};
