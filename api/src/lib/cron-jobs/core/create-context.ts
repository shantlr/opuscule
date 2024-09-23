import { FetchSessionRepo } from 'data/repo/fetch-sessions';
import { startSession } from 'lib/flare-solverr';
import * as cheerio from 'cheerio';
import { FetchPage, FetcherSession, SourceContext } from 'sources/types';
import { joinUrl } from 'lib/utils/join-url';
import { HtmlCacheRepo } from 'data/repo/html-cache';
import { execOperations } from 'sources/exec-op';
import { SourceRepo } from 'data/repo/source';
import { keyBy, uniq } from 'lodash';
import { FetchPictureJob, fetchPictures } from './fetch-pictures';
import { Sources } from 'sources';

export const createPage = ({ data }: { data: string }): FetchPage => {
  const $ = cheerio.load(data);
  const page: FetchPage = {
    map: (op) => {
      return execOperations($, op);
    },
  };

  return page;
};

export const createFetcherSession = (
  sessionId: string,
  prevSession: Awaited<ReturnType<(typeof FetchSessionRepo)['get']['byKey']>>,
  options: Parameters<SourceContext['initFetcherSession']>[0],
): FetcherSession => {
  let currentFetchSession = prevSession;

  const session: FetcherSession = {
    go: async (path: string) => {
      const url = options?.baseUrl ? joinUrl(options.baseUrl, path) : path;
      const cacheKey = `${sessionId}:${url}`;

      if (currentFetchSession) {
        // using cache
        const cacheData = await HtmlCacheRepo.get(cacheKey);
        if (cacheData?.data) {
          console.log(
            `[fetcher-session] resolved page from cache '${cacheKey}'`,
          );
          return createPage({
            data: cacheData.data,
          });
        }
      }

      // start new session
      console.log(`[fetcher-session] starting new session for '${url}'`);
      const flareRes = await startSession({ url });
      currentFetchSession = await FetchSessionRepo.create({
        key: sessionId,
        cookies: flareRes.solution.cookies,
        user_agent: flareRes.solution.userAgent,
      });
      await HtmlCacheRepo.create(
        cacheKey,
        flareRes.solution.response,
        flareRes.solution.status,
      );

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
          for (const book of items) {
            if (!book.chapters?.length) {
              continue;
            }

            const { chapters } = book;
            const existingChapters =
              await SourceRepo.chapters.get.listByNumbers({
                sourceId,
                sourceBookId: book.id,
                chapterIds: book.chapters.map((i) => i.id),
              });
            const existingByNumber = keyBy(
              existingChapters,
              (c) => c.chapter_id,
            );
            const toCreate = chapters.filter((i) => !existingByNumber[i.id]);

            await SourceRepo.chapters.creates({
              sourceId,
              sourceBookId: book.id,
              chapters: toCreate,
            });
            if (toCreate.length) {
              console.log(
                `[book-upsert] ${sourceId}/${book.id} ${toCreate.length} chapters created`,
              );
            }
          }
        }
      },
    },
    chapters: {},
  };
  return context;
};
