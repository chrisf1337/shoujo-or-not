import { Client, Pool } from 'pg';

export const pool = new Pool({ database: 'shoujoornot' });
