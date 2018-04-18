import bodyParser from 'body-parser';
import express from 'express';
import _ from 'lodash';
import fetch from 'node-fetch';
import { IManga, Manga, Stats, StatsUpdate } from '../common';
import { pool } from './db';
import { urlToDom } from './fetchimgs';

const URL_BASE = 'https://www.mangareader.net';

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
  Promise.all(
    sample.map((m) =>
      urlToDom(m.url).then(
        (dom) =>
          URL_BASE +
          _.sample(dom.window.document.querySelectorAll('#listing > tbody > tr > td:first-child'))
            .children[1].href,
      ),
    ),
  )
    .then((urls) =>
      Promise.all(
        urls.map((url) =>
          urlToDom(url).then((dom) => {
            const pages = dom.window.document.getElementById('selectpage').children[0].children.length;
            let pageNum = 1;
            if (pages >= 3) {
              pageNum = _.random(2, pages - 1);
            } else {
              pageNum = _.random(1, pages);
            }
            return url + `/${pageNum}`;
          }),
        ),
      ),
    )
    .then((urls) => {
      console.log(urls);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(sample));
    });
});

// Given a list of StatsUpdate objects, updates the stats db
app.post('/api/update', (req, res) => {
  const update: StatsUpdate = req.body;
  console.log(update);
  (async () => {
    const rows: Stats[] = (await pool.query(`select * from stats where id = $1`, [update.id])).rows;
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
    .then((row: Stats) => res.status(200).send(JSON.stringify(row)))
    .catch((err) => res.status(404).send(err.toString()));
});

app.listen(3000, () => console.log('Listening on port 3000'));
