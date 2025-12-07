import { Book, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: '经典文学' },
  { id: '2', name: '悬疑推理' },
  { id: '3', name: '职场成长' },
  { id: '4', name: '情感治愈' },
  { id: '5', name: '历史传奇' },
  { id: '6', name: '科幻未来' },
];

export const HERO_BOOKS: Book[] = [
  {
    id: 'h1',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    coverUrl: 'https://picsum.photos/600/600?random=1',
  },
  {
    id: 'h2',
    title: '月亮与六便士',
    author: '毛姆',
    coverUrl: 'https://picsum.photos/600/600?random=2',
  },
  {
    id: 'h3',
    title: '三体：死神永生',
    author: '刘慈欣',
    coverUrl: 'https://picsum.photos/600/600?random=3',
  },
];

export const EDITORS_PICKS: Book[] = [
  {
    id: 'e1',
    title: '局外人',
    author: '阿尔贝·加缪',
    playCount: '230万播放',
    coverUrl: 'https://picsum.photos/300/400?random=4',
  },
  {
    id: 'e2',
    title: '杀死一只知更鸟',
    author: '哈珀·李',
    playCount: '185万播放',
    coverUrl: 'https://picsum.photos/300/400?random=5',
  },
  {
    id: 'e3',
    title: '悉达多',
    author: '赫尔曼·黑塞',
    playCount: '98万播放',
    coverUrl: 'https://picsum.photos/300/400?random=6',
  },
  {
    id: 'e4',
    title: '人类简史',
    author: '赫拉利',
    playCount: '410万播放',
    coverUrl: 'https://picsum.photos/300/400?random=7',
  },
];

export const RANKING_BOOKS: Book[] = [
  {
    id: 'r1',
    title: '活着',
    author: '余华',
    rank: 1,
    coverUrl: 'https://picsum.photos/200/200?random=8',
    category: '当代文学',
    playCount: '999万+'
  },
  {
    id: 'r2',
    title: '明朝那些事儿',
    author: '当年明月',
    rank: 2,
    coverUrl: 'https://picsum.photos/200/200?random=9',
    category: '历史',
    playCount: '850万'
  },
  {
    id: 'r3',
    title: '白夜行',
    author: '东野圭吾',
    rank: 3,
    coverUrl: 'https://picsum.photos/200/200?random=10',
    category: '悬疑',
    playCount: '720万'
  },
  {
    id: 'r4',
    title: '金字塔原理',
    author: '巴巴拉·明托',
    rank: 4,
    coverUrl: 'https://picsum.photos/200/200?random=11',
    category: '职场',
    playCount: '540万'
  },
  {
    id: 'r5',
    title: '蛤蟆先生去看心理医生',
    author: '罗伯特·戴博德',
    rank: 5,
    coverUrl: 'https://picsum.photos/200/200?random=12',
    category: '心理',
    playCount: '490万'
  }
];