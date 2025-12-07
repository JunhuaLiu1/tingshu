export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  playCount?: string;
  category?: string;
  rank?: number;
}

export interface Category {
  id: string;
  name: string;
}

export enum Tab {
  HOME = 'home',
  SEARCH = 'search',
  PLAYER = 'player',
  HISTORY = 'history',
  PROFILE = 'profile',
}