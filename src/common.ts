export interface Stats {
  id: number;
  manga: number;
  correct: number;
  total: number;
}

export interface StatsUpdate {
  id: number;
  correct: boolean;
}

export interface Manga {
  id: number;
  name: string;
  url: string;
  isShoujo: boolean;
}

export interface MangaAndPage {
  manga: Manga;
  pageUrl: string;
}
