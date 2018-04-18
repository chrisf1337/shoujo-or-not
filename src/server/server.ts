import bodyParser from 'body-parser';
import express from 'express';
import * as _ from 'lodash';
import { pool } from './db';

class Manga {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly url: string,
    public readonly isShoujo: boolean,
  ) {}
}

interface IManga {
  id: number;
  name: string;
  url: string;
  isShoujo: boolean;
}

interface IStats {
  id: number;
  manga: number;
  correct: number;
  total: number;
}

interface StatsUpdate {
  id: number;
  correct: boolean;
}

let manga: Manga[];
(async () => {
  await pool.query(`create table if not exists manga (
    id serial primary key,
    name text not null,
    url text not null,
    isshoujo boolean not null
  )`);
  await pool.query(`create table if not exists stats (
    id serial primary key,
    manga integer references manga,
    correct integer not null default 0,
    total integer not null default 0
  )`);
  const mangaRows: IManga[] = (await pool.query('select * from manga;')).rows;
  const mga: Manga[] = [];
  const promises = [];
  for (const row of mangaRows) {
    mga.push(new Manga(row.id, row.name, row.url, row.isShoujo));
    promises.push(
      pool.query(
        `insert into stats (manga)
      select $1 where not exists (select manga from stats where manga = $1)`,
        [row.id],
      ),
    );
  }
  await Promise.all(promises).catch((e) => {
    throw e;
  });
  return mga;
})()
  .then((m) => {
    manga = m;
    console.log(`Loaded ${manga.length} manga`);
  })
  .catch((e) => console.log(e));

const app = express();
app.use('/', express.static('public'));
app.use('/dist/client', express.static('dist/client'));
app.use(bodyParser.json());

// Returns a list of n random manga
app.get('/api/randommanga', (req, res) => {
  const n = req.query.n;
  if (n == undefined || n <= 0) {
    res.status(400).send('n must be positive');
    return;
  }
  console.log(n);
  const sample = _.sampleSize(manga, n);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(sample));
});

// Given a list of StatsUpdate objects, updates the stats db
app.post('/api/update', (req, res) => {
  const update: StatsUpdate = req.body;
  console.log(update);
  (async () => {
    const rows: IStats[] = (await pool.query(`select * from stats where id = $1`, [update.id]))
      .rows;
    if (rows.length === 0) {
      throw new Error(`no manga with id ${update.id}`);
    }
    if (update.correct) {
      return (await pool.query(
        `update stats set correct = correct + 1, total = total + 1
        where id = $1 returning *`,
        [update.id],
      )).rows[0];
    } else {
      return (await pool.query(
        `update stats set correct = correct, total = total + 1
        where id = $1 returning *`,
        [update.id],
      )).rows[0];
    }
  })()
    .then((row: IStats) => res.status(200).send(JSON.stringify(row)))
    .catch((err) => res.status(404).send(err.toString()));
});

app.listen(3000, () => console.log('Listening on port 3000'));
