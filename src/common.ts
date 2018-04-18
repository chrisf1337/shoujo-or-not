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

export interface IManga {
  id: number;
  name: string;
  url: string;
  isShoujo: boolean;
}

export class Manga {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly url: string,
    public readonly isShoujo: boolean,
  ) {}
}
