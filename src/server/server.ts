require('source-map-support').install();
import bodyParser from 'body-parser';
import express from 'express';
import _ from 'lodash';
import fetch from 'node-fetch';
import { Manga, Stats, StatsUpdate, MangaAndPage } from '../common';
import { pool } from './db';
import { fetchImg } from './fetchimgs';

let manga: Manga[];
(async () => {
  await pool.query(`create table if not exists manga (
    id serial primary key,
    name text not null,
    url text not null,
    isshoujo boolean not null
  )`);
  await pool.query(`create table if not exists mangastats (
    id serial primary key,
    manga integer references manga,
    correct integer not null default 0,
    total integer not null default 0
  )`);
  await pool.query(`create table if not exists userstats (
    id serial primary key,
    correct integer not null default 0,
    total integer not null default 0
  )`);
  const manga: Manga[] = (await pool.query('select * from manga;')).rows;
  const promises = [];
  for (const m of manga) {
    promises.push(
      pool.query(
        `insert into mangastats (manga)
        select $1 where not exists (select manga from mangastats where manga = $1)`,
        [m.id],
      ),
    );
  }
  await Promise.all(promises).catch((e) => {
    throw e;
  });
  return manga;
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
  Promise.all(sample.map((m) => fetchImg(m.url))).then((urls) => {
    const response: MangaAndPage[] = [];
    for (let i = 0; i < n; i++) {
      response.push({ manga: sample[i], pageUrl: urls[i] });
    }
    res.header('Content-Type', 'application/json').send(JSON.stringify(response));
  });
});

// Get another random page from this manga
app.get('/api/randompage', (req, res) => {
  const id: number = req.query.id;
  if (id == undefined || id < 0) {
    res.status(404).send('id must be positive');
    return;
  }
  console.log(`id: ${id}`);
  (async () => {
    let rows = (await pool.query(`select * from manga where id = $1`, [id])).rows;
    if (rows.length === 0) {
      throw new Error(`manga id ${id} not found`);
    }
    const manga: Manga = rows[0];
    return fetchImg(manga.url);
  })()
    .then((url) => res.header('Content-Type', 'application/json').send(JSON.stringify(url)))
    .catch((err) => res.status(404).send(err.toString()));
});

// Given a list of StatsUpdate objects, updates the stats db
app.post('/api/update', (req, res) => {
  const updates: StatsUpdate[] = req.body;
  console.log(updates);
  Promise.all(
    updates.map((update) =>
      (async () => {
        const rows: Stats[] = (await pool.query(`select * from mangastats where id = $1`, [
          update.id,
        ])).rows;
        if (rows.length === 0) {
          throw new Error(`no manga with id ${update.id}`);
        }
        if (update.correct) {
          return (await pool.query(
            `update mangastats set correct = correct + 1, total = total + 1
            where id = $1 returning *`,
            [update.id],
          )).rows[0];
        } else {
          return (await pool.query(
            `update mangastats set correct = correct, total = total + 1
            where id = $1 returning *`,
            [update.id],
          )).rows[0];
        }
      })(),
    ),
  )
    .then((rows: Stats[]) => res.status(200).send(JSON.stringify(rows)))
    .catch((err) => res.status(404).send(err.toString()));
});

app.listen(3000, () => console.log('Listening on port 3000'));
