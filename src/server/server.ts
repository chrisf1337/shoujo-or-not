require('source-map-support').install();
import bodyParser from 'body-parser';
import express from 'express';
import _ from 'lodash';
import fetch from 'node-fetch';
import { Manga, MangaAndPage, QuizAnswer, QuizResponse, QuizResult, UserStats } from '../common';
import { dbRowToManga, pool } from './db';
import { fetchImg, fetchImgAndRetry } from './fetchimgs';
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

let manga: Manga[];
(async () => {
  await pool.query(`create table if not exists manga (
    id serial primary key,
    name text not null,
    url text not null,
    isshoujo boolean not null,
    correct integer not null default 0,
    total integer not null default 0
  )`);
  await pool.query(`create table if not exists userstats (
    id serial primary key,
    correct integer not null default 0,
    total integer not null default 0
  )`);
  const manga: Manga[] = (await pool.query('select * from manga;')).rows.map((row) =>
    dbRowToManga(row),
  );
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
app.use(
  session({
    store: new RedisStore(),
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
  }),
);

// Returns a list of n random manga
app.get('/api/randommanga', (req, res) => {
  console.log(req.session!.quizResponse);
  const n = req.query.n;
  if (n == undefined || n <= 0) {
    res.status(400).send('n must be positive');
    return;
  }
  console.log(n);
  const sample = _.sampleSize(manga, n);
  Promise.all(sample.map((m) => fetchImgAndRetry(m, m.url, manga))).then((mangaAndUrls) => {
    const response: MangaAndPage[] = mangaAndUrls.map(([m, url]) => ({
      mangaId: m.id,
      pageUrl: url,
    }));
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
    const rows = (await pool.query(`select * from manga where id = $1`, [id])).rows;
    if (rows.length === 0) {
      throw new Error(`manga id ${id} not found`);
    }
    const manga: Manga = dbRowToManga(rows[0]);
    return fetchImg(manga.url);
  })()
    .then((url) => res.header('Content-Type', 'application/json').send(JSON.stringify(url)))
    .catch((err) => res.status(404).send(err.toString()));
});

// Given a list of StatsUpdate objects, updates the stats db
app.post('/api/update', (req, res) => {
  const quizAnswers: QuizAnswer[] = req.body;
  Promise.all(
    quizAnswers.map((quizAnswer) =>
      (async () => {
        const rows: Manga[] = (await pool.query(`select * from manga where id = $1`, [
          quizAnswer.id,
        ])).rows;
        if (rows.length === 0) {
          throw new Error(`no manga with id ${quizAnswer.id}`);
        }
        let manga = dbRowToManga(rows[0]);
        console.log(manga);
        console.log(quizAnswer);
        if (quizAnswer.isShoujo === manga.isShoujo) {
          manga = dbRowToManga(
            (await pool.query(
              `update manga set correct = correct + 1, total = total + 1
            where id = $1 returning *`,
              [manga.id],
            )).rows[0],
          );
        } else {
          manga = dbRowToManga(
            (await pool.query(
              `update manga set correct = correct, total = total + 1
            where id = $1 returning *`,
              [manga.id],
            )).rows[0],
          );
        }
        return { manga, correct: quizAnswer.isShoujo === manga.isShoujo };
      })(),
    ),
  )
    .then((results: QuizResult[]) =>
      (async () => {
        console.log(results);
        let correct = 0;
        let total = results.length;
        for (const result of results) {
          if (result.correct) {
            correct += 1;
          }
        }
        if (total > 0) {
          await pool.query(`insert into userstats (correct, total) values ($1, $2)`, [
            correct,
            total,
          ]);
        }
        const userStats: UserStats[] = (await pool.query(`select * from userstats`)).rows;
        correct = 0;
        total = 0;
        for (const stats of userStats) {
          correct += stats.correct;
          total += stats.total;
        }

        const quizResponse: QuizResponse = {
          results,
          stats: { average: total === 0 ? 0 : correct / total },
        };
        req.session!.quizResponse = quizResponse;
        res.status(200).send(JSON.stringify(quizResponse));
      })(),
    )
    .catch((err) => res.status(404).send(err.toString()));
});

app.get('/api/results', (req, res) => {
  if (req.session!.quizResponse == null) {
    res.header(404).send('No results found');
    return;
  }
  res.contentType('application/json').send(JSON.stringify(req.session!.quizResponse));
});

app.listen(3000, () => console.log('Listening on port 3000'));
