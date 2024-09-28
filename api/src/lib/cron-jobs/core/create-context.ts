import { FetchSessionRepo } from 'data/repo/fetch-sessions';
import { startSession } from 'lib/flare-solverr';
import * as cheerio from 'cheerio';
import { FetchPage, FetcherSession, SourceContext } from 'sources/types';
import { joinUrl } from 'lib/utils/join-url';
import { HtmlCacheRepo } from 'data/repo/html-cache';
import { execOperations } from 'sources/exec-op';
import { SourceRepo } from 'data/repo/source';
import { keyBy, sortBy, uniq } from 'lodash';
import { FetchPictureJob, fetchPictures } from './fetch-pictures';
import { Sources } from 'sources';
import { formatCookie } from 'lib/utils/format-cookies';
import got, { OptionsOfTextResponseBody } from 'got';
import { CookieJar } from 'tough-cookie';

export const createPage = ({ data }: { data: string }): FetchPage => {
  const $ = cheerio.load(data);
  const page: FetchPage = {
    map: (op) => {
      return execOperations($, op);
    },
  };

  return page;
};

const createFetcher = async (
  session: NonNullable<
    Awaited<ReturnType<(typeof FetchSessionRepo)['get']['byKey']>>
  >,
) => {
  const cookieJar = new CookieJar();

  for (const cookie of session.cookies) {
    await cookieJar.setCookie(formatCookie(cookie), cookie.url);
  }

  const instance = got.extend({
    cookieJar,
  });

  return {
    async fetch(url: string, options?: OptionsOfTextResponseBody) {
      const cacheKey = `${session.key}:${url}`;
      const cacheData = await HtmlCacheRepo.get(cacheKey);
      if (cacheData?.data) {
        console.log(`[fetcher-session] resolved page from cache '${cacheKey}'`);
        return cacheData.data;
      }

      const res = await instance(url, {
        ...options,
        headers: {
          ...options?.headers,
          'User-Agent': session.user_agent,
        },
      });
      return res.body;
    },
  };
};

export const createFetcherSession = async (
  sessionId: string,
  prevSession: Awaited<ReturnType<(typeof FetchSessionRepo)['get']['byKey']>>,
  options: Parameters<SourceContext['initFetcherSession']>[0],
): Promise<FetcherSession> => {
  let currentFetchSession = prevSession;

  let fetcher = currentFetchSession
    ? await createFetcher(currentFetchSession)
    : null;

  const session: FetcherSession = {
    go: async (path: string) => {
      const url = options?.baseUrl ? joinUrl(options.baseUrl, path) : path;
      const cacheKey = `${sessionId}:${url}`;

      if (fetcher) {
        const res = await fetcher.fetch(url);
        return createPage({
          data: res,
        });
      }

      // start new session
      console.log(`[fetcher-session] starting new session for '${url}'`);
      const flareRes = await startSession({ url });
      currentFetchSession = await FetchSessionRepo.create(url, {
        key: sessionId,
        cookies: flareRes.solution.cookies,
        user_agent: flareRes.solution.userAgent,
      });
      await HtmlCacheRepo.create(
        cacheKey,
        flareRes.solution.response,
        flareRes.solution.status,
      );

      fetcher = await createFetcher(currentFetchSession);
      return createPage({
        data: flareRes.solution.response,
      });
    },
  };
  return session;
};

export const createContext = ({
  sourceId,
}: {
  sourceId: string;
}): SourceContext => {
  const source = Sources.find((s) => s.id === sourceId);
  if (!source) {
    throw new Error(`Source '${sourceId}' not found`);
  }

  const context: SourceContext = {
    initFetcherSession: async (options) => {
      const sessionId = options?.sessionId ?? sourceId;
      const prevSession = await FetchSessionRepo.get.byKey(sessionId);
      return createFetcherSession(sessionId, prevSession, {
        ...options,
        baseUrl: options?.baseUrl ?? source.url,
      });
    },
    books: {
      upsert: async (items) => {
        const itemsById = keyBy(items, (i) => i.id);
        const existings = await SourceRepo.books.get.listById(
          sourceId,
          items.map((i) => i.id),
        );

        const missings: (Omit<(typeof items)[number], 'title'> & {
          title: string;
        })[] = [];
        const toUpdate: typeof items = [];
        const coverToFetches: FetchPictureJob[] = [];

        const existingById = keyBy(existings, (b) => b.source_book_id);

        items.forEach((item) => {
          if (!existingById[item.id]) {
            missings.push(
              item as Omit<(typeof items)[number], 'title'> & {
                title: string;
              },
            );
          }
        });

        existings.forEach((existingSourceBook) => {
          const item = itemsById[existingSourceBook.source_book_id];
          if (item.title !== existingSourceBook.title) {
            toUpdate.push(item);
          }

          if (!item.coverUrl) {
            console.log(`[book-upsert] ${sourceId}/${item.id} no cover found`);
          }

          if (
            (item.title || existingSourceBook) &&
            item.coverUrl &&
            existingSourceBook.cover_origin_url !== item.coverUrl
          ) {
            coverToFetches.push({
              type: 'source_book_cover',
              source_id: sourceId,
              source_book_id: item.id,
              img_url: item.coverUrl,
            });
          }
        });

        await SourceRepo.books.creates(sourceId, missings);
        await SourceRepo.books.updates(sourceId, toUpdate);
        console.log(
          `[book-upsert] ${items.length} input items | ${missings.length} created | ${toUpdate.length} updated`,
        );

        coverToFetches.push(
          ...missings
            .filter((item) => item.coverUrl)
            .map((item) => ({
              type: 'source_book_cover' as const,
              source_id: sourceId,
              source_book_id: item.id,
              img_url: item.coverUrl!,
            })),
        );
        await fetchPictures(coverToFetches);
        console.log(`[book-upsert] ${coverToFetches.length} covers fetched`);
        await SourceRepo.books.syncBooks(
          sourceId,
          uniq([
            ...existings.filter((e) => !e.book_id).map((e) => e.source_book_id),
            ...missings.map((m) => m.id),
            ...toUpdate.map((m) => m.id),
            ...coverToFetches.map((c) => c.source_book_id),
          ]),
        );

        // Upsert chapters
        {
          for (const sourceBook of items) {
            if (!sourceBook.chapters?.length) {
              continue;
            }

            const { chapters } = sourceBook;
            const existingChapters =
              await SourceRepo.chapters.get.listByNumbers({
                sourceId,
                sourceBookId: sourceBook.id,
                chapterIds: sourceBook.chapters.map((i) => i.id),
              });
            const existingByNumber = keyBy(
              existingChapters,
              (c) => c.chapter_id,
            );
            const toCreate = chapters.filter((i) => !existingByNumber[i.id]);

            await SourceRepo.chapters.creates({
              sourceId,
              sourceBookId: sourceBook.id,
              chapters: toCreate,
            });

            const sorted = sortBy(toCreate, (c) => c.rank);
            const msg =
              sorted.length === 0
                ? `no new chapters`
                : sorted.length > 1
                  ? `chapter ${sorted[0].id} created`
                  : `chapters ${sorted[0].id}..${sorted.at(-1)?.id} created`;

            if (toCreate.length) {
              console.log(`[book-upsert] ${sourceId}/${sourceBook.id} ${msg}`);
            }
          }
        }
      },
    },
    chapters: {},
  };
  return context;
};
