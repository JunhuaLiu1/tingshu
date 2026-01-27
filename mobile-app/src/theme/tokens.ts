export const tokens = {
  // 颜色系统
  colors: {
    primary: '#FF6B35',
    primaryLight: '#FF8C5A',
    primaryDark: '#E65A2B',
    
    background: '#F5F6F8',
    surface: '#FFFFFF',
    
    text: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#FFFFFF',
    },
    
    border: {
      light: '#F0F0F0',
      default: '#E0E0E0',
      dark: '#CCCCCC',
    },
    
    semantic: {
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
      info: '#2196F3',
    },
    
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // 间距系统（基于 8px 网格）
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  // 字体层级系统
  typography: {
    h1: 24,
    h2: 20,
    h3: 18,
    body: 16,
    caption: 14,
    small: 12,
  },
  
  // 字重
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // 圆角系统
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  // 阴影系统
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
  
  // 动画时长
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  // 触摸反馈
  opacity: {
    active: 0.7,
    disabled: 0.5,
  },
};

export type Tokens = typeof tokens;
