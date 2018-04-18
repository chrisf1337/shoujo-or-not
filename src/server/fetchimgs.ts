import { JSDOM } from 'jsdom';
import _ from 'lodash';
import fetch from 'node-fetch';
import { Manga } from '../common';

const URL_BASE = 'https://www.mangareader.net';

export async function urlToDom(url: string): Promise<JSDOM> {
  console.info(`fetching ${url}`);
  const resp = await fetch(url);
  const text = await resp.text();
  return new JSDOM(text);
}

export async function fetchImg(url: string): Promise<string> {
  const mangaPage = await urlToDom(url);
  const chapterUrl =
    URL_BASE +
    _.sample(mangaPage.window.document.querySelectorAll('#listing > tbody > tr > td:first-child'))
      .children[1].href;
  const chapterPage = await urlToDom(chapterUrl);
  const pages = chapterPage.window.document.getElementById('selectpage').children[0].children
    .length;
  let pageNum = 1;
  if (pages >= 3) {
    pageNum = _.random(2, pages - 1);
  } else {
    pageNum = _.random(1, pages);
  }
  const page = await urlToDom(chapterUrl + `/${pageNum}`);
  const img = page.window.document.getElementById('img');
  return img.src;
}
