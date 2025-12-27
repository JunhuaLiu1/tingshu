// mobile-app/src/constants/design-tokens.ts

/**
 * 设计令牌 - 集中管理所有硬编码值
 * 避免在组件中直接使用魔术数字和硬编码颜色
 */

// 统计信息配置
export const STATS_CONFIG = {
  carousel: {
    playCount: '1.2k',        // 示例数据，实际应从 API 获取
    remainingTime: '45m left', // 示例数据，实际应从 API 获取
  },
} as const;

// 颜色配置（扩展自 tokens.ts）
export const COLORS = {
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
    dashed: 'rgba(0,0,0,0.1)',
  },

  // 组件特定颜色
  heroCard: {
    background: '#FDE4D0',
    shadow: '#FF6B35',
    notch: '#F5F6F8',
    badgeOverlay: 'rgba(255,255,255,0.4)',
  },

  category: {
    activeBg: '#FFF5F0',
    inactiveBg: '#f5f5f5',
  },

  ranking: {
    badgeBg: '#FFF5F0',
    badgeText: '#FF6B35',
  },

  opacity: {
    active: 0.8,
  },
} as const;

// 间距配置
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  ranking: {
    padding: 12,
  },
} as const;

// 尺寸配置
export const SIZES = {
  hero: {
    height: 200,
    padding: 24,
    radius: 32,
    smallCoverWidth: 64,
    smallCoverHeight: 80,
    smallCoverRadius: 8,
  },
  carousel: {
    containerHeight: 220,
  },
  category: {
    minWidth: 100,
    padding: 16,
    radius: 24,
  },
  badge: {
    radius: 6,
    paddingVertical: 4,
  },
  ranking: {
    coverSize: 56,
    radius: 14,
    padding: 12,
  },
  lineHeight: {
    h3: 24,
  },
  avatar: {
    size: 80,
  },
  icon: {
    small: 14,
    medium: 20,
    large: 24,
  },
  button: {
    play: 40,
  },
  typography: {
    h3: 20,
    caption: 14,
    small: 12,
    badge: 10,
  },
} as const;

// 阴影配置
export const SHADOWS = {
  hero: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 20 } as const,
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 } as const,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 } as const,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// 轮播配置
export const CAROUSEL_CONFIG = {
  autoScrollInterval: 6000, // 毫秒
  paginationDotWidth: 8,
  paginationActiveWidth: 24,
  notchSize: 24,
  notchOffset: 12,
  dashedLineWidth: 2,
  dashedLineOffset: 1,
} as const;

// 分类图标映射
export const CATEGORY_ICONS: Record<number, string> = {
  1: 'menu-book',      // 经典文学
  2: 'explore',        // 悬疑推理
  3: 'work',           // 职场成长
  4: 'favorite',       // 情感治愈
  5: 'history',        // 历史传奇
  6: 'rocket',         // 科幻未来
} as const;

// 导出类型
export type StatsConfig = typeof STATS_CONFIG;
export type Colors = typeof COLORS;
export type Spacing = typeof SPACING;
export type Sizes = typeof SIZES;
export type Shadows = typeof SHADOWS;
export type CarouselConfig = typeof CAROUSEL_CONFIG;