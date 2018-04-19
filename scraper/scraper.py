#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import psycopg2


conn = psycopg2.connect(dbname='shoujoornot')
cur = conn.cursor()

url_base = 'https://www.mangareader.net'
sol_url_search_base = '{}/search/?w=&rd=0&status=0&order=0&genre=0000000000000000000000000000100000000&p='.format(url_base)
shoujo_url_search_base = '{}/search/?w=&rd=0&status=0&order=0&genre=0000000000000000000000001000000000000&p='.format(url_base)
sol_last_i = 570
shoujo_last_i = 1200


def scrape(cur, url_search_base: str, last_i: int, is_shoujo: bool):
    responses = []
    for i in range(0, last_i + 1, 30):
        url = '{}{}'.format(url_search_base, i)
        print(url)
        response = requests.get(url)
        if response.status_code != 200:
            print('GET {}: {}'.format(url, response.status_code))
            break
        else:
            print(response)
        responses.append(response)

    manga = []
    for resp in responses:
        soup = BeautifulSoup(resp.text, 'html.parser')
        for tag in soup.select('h3 > a'):
            m = {'name': tag.text, 'url': '{}{}'.format(url_base, tag['href']), 'is_shoujo': 'true' if is_shoujo else 'false'}
            print(m)
            manga.append(m)

    cur.executemany('insert into manga (name, url, isshoujo) select %(name)s, %(url)s, %(is_shoujo)s where not exists (select name from manga where name = %(name)s)', manga)


def commit(conn, cur):
    conn.commit()
    cur.close()
    conn.close()


scrape(cur, shoujo_url_search_base, shoujo_last_i, True)
scrape(cur, sol_url_search_base, sol_last_i, False)
commit(conn, cur)
