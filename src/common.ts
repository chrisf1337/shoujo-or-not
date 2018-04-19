export interface UserStats {
  id: number;
  correct: number;
  total: number;
}

export interface QuizAnswer {
  id: number;
  isShoujo: boolean;
}

export interface QuizResult {
  manga: Manga;
  correct: boolean;
}

export interface UserAggregateStats {
  average: number;
}

export interface QuizResponse {
  results: QuizResult[];
  stats: UserAggregateStats;
}

export interface Manga {
  id: number;
  name: string;
  url: string;
  isShoujo: boolean;
  correct: number;
  total: number;
}

export interface MangaAndPage {
  mangaId: number;
  pageUrl: string;
}

export enum SelectedOption {
  Yes,
  No,
}
