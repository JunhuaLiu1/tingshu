import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from './tokens';

// 卡片样式生成函数
export const createCardStyle = (
  elevation: 'sm' | 'md' | 'lg' = 'md'
): ViewStyle => ({
  backgroundColor: tokens.colors.surface,
  borderRadius: tokens.radius.md,
  ...tokens.shadows[elevation],
});

// 按钮样式生成函数
export const createButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
): ViewStyle => {
  const baseStyle: ViewStyle = {
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // 尺寸
  const sizeStyles: Record<string, ViewStyle> = {
    small: {
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
    },
    medium: {
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.md,
    },
    large: {
      paddingHorizontal: tokens.spacing.xl,
      paddingVertical: tokens.spacing.lg,
    },
  };
  
  // 变体
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: tokens.colors.primary,
    },
    secondary: {
      backgroundColor: tokens.colors.background,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tokens.colors.primary,
    },
  };
  
  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

// 文本样式生成函数
export const createTextStyle = (
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small' = 'body',
  color: keyof typeof tokens.colors.text = 'primary',
  weight: keyof typeof tokens.fontWeight = 'regular'
): TextStyle => ({
  fontSize: tokens.typography[variant],
  color: tokens.colors.text[color],
  fontWeight: tokens.fontWeight[weight],
});

// 布局样式
export const layoutStyles = {
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  } as ViewStyle,
  
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  } as ViewStyle,
  
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
};
