import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { Manga } from '../common';

export async function urlToDom(url: string): Promise<JSDOM> {
  console.log(url);
  const resp = await fetch(url);
  const text = await resp.text();
  return new JSDOM(text);
}
