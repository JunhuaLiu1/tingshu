import { Book, Category, BookWithStats } from "../types";

// 分类数据
export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: "经典文学",
    description: "经典文学作品",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 2,
    name: "悬疑推理",
    description: "悬疑推理小说",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 3,
    name: "职场成长",
    description: "职场成长类书籍",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 4,
    name: "情感治愈",
    description: "情感治愈类书籍",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 5,
    name: "历史传奇",
    description: "历史传奇故事",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 6,
    name: "科幻未来",
    description: "科幻未来题材",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

// 轮播书籍数据
export const HERO_BOOKS: BookWithStats[] = [
  {
    id: 1,
    title: "百年孤独",
    author: "加西亚·马尔克斯",
    cover_url: "",
    description: "魔幻现实主义的巅峰之作，讲述布恩迪亚家族七代人的传奇故事。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    stats: {
      playCount: "1.2k",
      remainingTime: "45m left",
    },
  },
  {
    id: 2,
    title: "月亮与六便士",
    author: "毛姆",
    cover_url: "",
    description: "关于梦想与现实、理想与冲突的永恒话题。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    stats: {
      playCount: "2.8k",
      remainingTime: "38m left",
    },
  },
  {
    id: 3,
    title: "三体：死神永生",
    author: "刘慈欣",
    cover_url: "",
    description: "中国科幻的巅峰之作，探讨宇宙文明与人类命运。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    stats: {
      playCount: "5.1k",
      remainingTime: "1h 12m left",
    },
  },
];

// 编辑推荐书籍
export const EDITORS_PICKS: Book[] = [
  {
    id: 4,
    title: "局外人",
    author: "阿尔贝·加缪",
    cover_url: "",
    play_count: 2300000,
    playCount: "230万播放",
    description: "存在主义文学的经典之作。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 5,
    title: "杀死一只知更鸟",
    author: "哈珀·李",
    cover_url: "",
    play_count: 1850000,
    playCount: "185万播放",
    description: "关于正义与偏见的深刻思考。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 6,
    title: "悉达多",
    author: "赫尔曼·黑塞",
    cover_url: "",
    play_count: 980000,
    playCount: "98万播放",
    description: "关于自我探索与人生哲学的思考。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 7,
    title: "人类简史",
    author: "赫拉利",
    cover_url: "",
    play_count: 4100000,
    playCount: "410万播放",
    description: "从认知革命到人工智能的人类发展史。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

// 排行榜书籍
export const RANKING_BOOKS: Book[] = [
  {
    id: 8,
    title: "活着",
    author: "余华",
    rank: 1,
    cover_url: "",
    category: "当代文学",
    play_count: 9990000,
    playCount: "999万+",
    description: "一个中国农民的苦难与韧性。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 9,
    title: "明朝那些事儿",
    author: "当年明月",
    rank: 2,
    cover_url: "",
    category: "历史",
    play_count: 8500000,
    playCount: "850万",
    description: "用现代语言讲述明朝三百年历史。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 10,
    title: "白夜行",
    author: "东野圭吾",
    rank: 3,
    cover_url: "",
    category: "悬疑",
    play_count: 7200000,
    playCount: "720万",
    description: "一段长达十九年的悬疑爱情故事。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 11,
    title: "金字塔原理",
    author: "巴巴拉·明托",
    rank: 4,
    cover_url: "",
    category: "职场",
    play_count: 5400000,
    playCount: "540万",
    description: "提高逻辑思维和表达能力的方法论。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 12,
    title: "蛤蟆先生去看心理医生",
    author: "罗伯特·戴博德",
    rank: 5,
    cover_url: "",
    category: "心理",
    play_count: 4900000,
    playCount: "490万",
    description: "通过蛤蟆的心理治疗历程，学习心理健康知识。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

// 获取所有书籍的合并列表
export const ALL_BOOKS: Book[] = [
  ...HERO_BOOKS,
  ...EDITORS_PICKS,
  ...RANKING_BOOKS,
];

// 获取书籍的封面 URL（兼容两种格式）
export const getBookCoverUrl = (book: Book): string => {
  return book.cover_url || book.coverUrl || "";
};

// 获取书籍的播放次数（格式化显示）
export const getBookPlayCount = (book: Book): string => {
  if (book.playCount) {
    return book.playCount;
  }
  if (book.play_count) {
    const count = book.play_count;
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万播放`;
    }
    return `${count}播放`;
  }
  return "0播放";
};
