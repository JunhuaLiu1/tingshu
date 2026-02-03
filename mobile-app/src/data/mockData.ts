import { Book, Category, BookWithStats } from "../types";

// 分类数据
export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: "世界名著",
    description: "世界经典名著",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 2,
    name: "外国小说",
    description: "国外经典与畅销小说",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 3,
    name: "中国古典名著",
    description: "四大名著与古典文学",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 4,
    name: "悬疑推理",
    description: "悬疑推理小说",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 5,
    name: "历史传记",
    description: "历史故事与人物传记",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 6,
    name: "科幻经典",
    description: "科幻经典与未来幻想",
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
    cover_url: "https://picsum.photos/600/600?random=1",
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
    title: "悲惨世界",
    author: "维克多·雨果",
    cover_url: "https://picsum.photos/600/600?random=2",
    description: "人性、救赎与时代洪流交织的宏大史诗。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    stats: {
      playCount: "2.8k",
      remainingTime: "38m left",
    },
  },
  {
    id: 3,
    title: "战争与和平",
    author: "列夫·托尔斯泰",
    cover_url: "https://picsum.photos/600/600?random=3",
    description: "在战争与爱情之间，书写时代与人的命运。",
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
    title: "小王子",
    author: "圣埃克苏佩里",
    cover_url: "https://picsum.photos/300/400?random=4",
    play_count: 2300000,
    playCount: "230万播放",
    description: "写给大人的童话，关于爱与责任。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 5,
    title: "傲慢与偏见",
    author: "简·奥斯汀",
    cover_url: "https://picsum.photos/300/400?random=5",
    play_count: 1850000,
    playCount: "185万播放",
    description: "在偏见与自尊之间，寻找爱情与成长。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 6,
    title: "老人与海",
    author: "欧内斯特·海明威",
    cover_url: "https://picsum.photos/300/400?random=6",
    play_count: 980000,
    playCount: "98万播放",
    description: "人与命运对抗的意志之歌。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 7,
    title: "基督山伯爵",
    author: "大仲马",
    cover_url: "https://picsum.photos/300/400?random=7",
    play_count: 4100000,
    playCount: "410万播放",
    description: "复仇、正义与救赎的经典传奇。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

// 排行榜书籍
export const RANKING_BOOKS: Book[] = [
  {
    id: 8,
    title: "红楼梦",
    author: "曹雪芹",
    rank: 1,
    cover_url: "https://picsum.photos/200/200?random=8",
    category: "中国古典名著",
    play_count: 9990000,
    playCount: "999万+",
    description: "写尽世情冷暖的巅峰之作。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 9,
    title: "1984",
    author: "乔治·奥威尔",
    rank: 2,
    cover_url: "https://picsum.photos/200/200?random=9",
    category: "世界名著",
    play_count: 8500000,
    playCount: "850万",
    description: "反乌托邦文学的经典代表。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 10,
    title: "飘",
    author: "玛格丽特·米切尔",
    rank: 3,
    cover_url: "https://picsum.photos/200/200?random=10",
    category: "外国小说",
    play_count: 7200000,
    playCount: "720万",
    description: "在风暴年代里，爱与坚韧并存。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 11,
    title: "福尔摩斯探案集",
    author: "柯南·道尔",
    rank: 4,
    cover_url: "https://picsum.photos/200/200?random=11",
    category: "悬疑推理",
    play_count: 5400000,
    playCount: "540万",
    description: "推理文学奠基之作，经典案件再现。",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 12,
    title: "简爱",
    author: "夏洛蒂·勃朗特",
    rank: 5,
    cover_url: "https://picsum.photos/200/200?random=12",
    category: "世界名著",
    play_count: 4900000,
    playCount: "490万",
    description: "女性成长与独立精神的经典叙事。",
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
  return (
    book.cover_url ||
    book.coverUrl ||
    "https://picsum.photos/300/400?random=default"
  );
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
