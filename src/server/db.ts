import { Client, Pool } from 'pg';
import { Manga } from '../common';

export const pool = new Pool({ database: 'shoujoornot' });

export function dbRowToManga(row: any): Manga {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    isShoujo: row.isshoujo,
    correct: row.correct,
    total: row.total,
  };
}
