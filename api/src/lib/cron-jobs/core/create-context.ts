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
import got, { HTTPError, OptionsInit, OptionsOfTextResponseBody } from 'got';
import { CookieJar } from 'tough-cookie';
import { BookRepo } from 'data/repo/books-repo';
import { ACCURACY } from 'config/constants';

export const createPage = ({ data }: { data: string }): FetchPage => {
  const $ = cheerio.load(data);
  const page: FetchPage = {
    map: (op) => {
      return execOperations($, op);
    },
  };
  console.log('DQSDQSD');

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
    // cookieJar,
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
      console.log(`[fetcher-session] fetched page '${url}': ${res.statusCode}`);

      await HtmlCacheRepo.create(cacheKey, res.body, res.statusCode);

      return res.body;
    },
    stream(url: string, options?: OptionsInit) {
      try {
        console.log('sTREAM', url);
        console.group('DEFAULT', instance.defaults.options);

        return instance.stream(url, {
          headers: {
            // 'User-Agent': session.user_agent,
            'user-agent': undefined,
            ...options?.headers,
          },
        });
      } catch (err) {
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>');
        throw err;
      }
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

  if (currentFetchSession && fetcher) {
    console.log(`[fetcher-session] reusing session '${sessionId}'`);
  }

  const session: FetcherSession = {
    go: async (path: string) => {
      const url = options?.baseUrl ? joinUrl(options.baseUrl, path) : path;

      try {
        if (fetcher) {
          const res = await fetcher.fetch(url);
          console.log('>>>');
          return createPage({
            data: res,
          });
        }

        // start new session
        console.log(`[fetcher-session] starting new session for '${url}'`);
        const flareRes = await startSession({ url });
        currentFetchSession = await FetchSessionRepo.create({
          key: sessionId,
          cookies: flareRes.solution.cookies.map((c) => ({
            ...c,
            url,
          })),
          user_agent: flareRes.solution.userAgent,
        });
        const cacheKey = `${currentFetchSession.key}:${url}`;
        await HtmlCacheRepo.create(
          cacheKey,
          flareRes.solution.response,
          flareRes.solution.status,
        );

        fetcher = await createFetcher(currentFetchSession);
        return createPage({
          data: flareRes.solution.response,
        });
      } catch (err) {
        if (err instanceof HTTPError) {
          if (err.response.statusCode === 403) {
            console.log(
              `[fetcher-session] got 403 while fetching ${url}, deleting session`,
            );
            await FetchSessionRepo.delete(sessionId);
          }
        }
        throw err;
      }
    },
    stream: (path: string, streamOptions) => {
      const url = options?.baseUrl ? joinUrl(options.baseUrl, path) : path;
      return fetcher!.stream(url, streamOptions);
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
      const prevSession = !options?.ignorePrevSession
        ? await FetchSessionRepo.get.byKey(sessionId)
        : undefined;
      return createFetcherSession(sessionId, prevSession, {
        ...options,
        baseUrl: options?.baseUrl ?? source.url,
      });
    },
    books: {
      upsert: async (items) => {
        await SourceRepo.ensureCreated(sourceId);
        const itemsById = keyBy(items, (i) => i.id);

        //#region Book upsert
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

          const shouldUpdateTitle =
            item.title !== existingSourceBook.title &&
            (item.titleAccuracy ?? ACCURACY.LOW) >=
              (existingSourceBook.title_accuracy ?? ACCURACY.LOW);
          const shouldUpdateDescription =
            item.description !== existingSourceBook.description &&
            (item.descriptionAccuracy ?? ACCURACY.LOW) >=
              (existingSourceBook.description_accuracy ?? ACCURACY.LOW);

          if (shouldUpdateTitle || shouldUpdateDescription) {
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
        //#endregion

        //#region Book cover
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
        //#endregion

        await SourceRepo.books.syncBooks(
          sourceId,
          uniq([
            ...existings.filter((e) => !e.book_id).map((e) => e.source_book_id),
            ...missings.map((m) => m.id),
            ...toUpdate.map((m) => m.id),
            ...coverToFetches.map((c) => c.source_book_id),
          ]),
        );

        //#region Upsert chapters
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
            const toCreate: typeof chapters = [];
            const toUpdate: typeof chapters = [];

            for (const chapter of chapters) {
              const existing = existingByNumber[chapter.id];
              if (!existing) {
                toCreate.push(chapter);
                continue;
              }

              const shouldUpdatePublishedAt =
                existing.published_at !== chapter.publishedAt &&
                (chapter.publishedAccuracy ?? ACCURACY.LOW) >=
                  (existing.published_at_accuracy ?? ACCURACY.LOW);
              if (shouldUpdatePublishedAt) {
                toUpdate.push(chapter);
              }
            }

            await SourceRepo.chapters.creates({
              sourceId,
              sourceBookId: sourceBook.id,
              chapters: toCreate,
            });
            await SourceRepo.chapters.updates({
              sourceId,
              sourceBookId: sourceBook.id,
              chapters: toUpdate,
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
        //#endregion
      },
    },
    chapters: {
      upsert: async ({ chapterId, sourceBookId, pages }) => {
        await BookRepo.chapters.updates.pages({
          sourceBookId,
          sourceChapterId: chapterId,
          pages,
        });
      },
    },
  };
  return context;
};
