import * as cheerio from 'cheerio';
import { ACCURACY } from 'config/constants';
import { defaultLogger, Logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { FetchSessionRepo } from 'data/repo/fetch-sessions';
import { HtmlCacheRepo } from 'data/repo/html-cache';
import { SourceRepo } from 'data/repo/source';
import { UserStateRepo } from 'data/repo/use-state';
import { startSession } from 'lib/flare-solverr';
import { joinUrl } from 'lib/utils/join-url';
import { keyBy, sortBy, uniq } from 'lodash';
import { Sources } from 'sources';
import { execOperations } from 'sources/exec-op';

import { SourceContext } from './types';
import { FetcherSession } from './types';
import { FetchPage } from './types';

export const createPage = ({ data }: { data: string }): FetchPage => {
  const $ = cheerio.load(data);
  const page: FetchPage = {
    html: data,
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
  logger = defaultLogger,
) => {
  const log = logger.scope('fetcher-session');

  return {
    async fetch(url: string, options?: RequestInit) {
      const cacheKey = `${session.key}:${url}`;
      const cacheData = await HtmlCacheRepo.get.byUrl(cacheKey);
      if (cacheData?.data) {
        log.info(`[fetcher-session] resolved page from cache '${cacheKey}'`);
        return cacheData.data;
      }

      const res = await fetch(url, {
        headers: {
          ...options?.headers,
          'User-Agent': session.user_agent,
        },
      });
      log.info(`[fetcher-session] fetched page '${url}': ${res.status}`);

      const result = await res.text();

      await HtmlCacheRepo.create(cacheKey, result, res.status);

      return result;
    },
  };
};

export const createFetcherSession = async (
  sessionId: string,
  prevSession: Awaited<ReturnType<(typeof FetchSessionRepo)['get']['byKey']>>,
  options: Parameters<SourceContext['initFetcherSession']>[0],
  logger = defaultLogger,
): Promise<FetcherSession> => {
  const log = logger.scope('fetcher-session');
  let currentFetchSession = prevSession;

  let fetcher = currentFetchSession
    ? await createFetcher(currentFetchSession)
    : null;

  if (currentFetchSession && fetcher) {
    log.info(`[fetcher-session] reusing session '${sessionId}'`);
  }

  const session: FetcherSession = {
    go: async (path: string) => {
      const url = options?.baseUrl ? joinUrl(options.baseUrl, path) : path;

      if (fetcher) {
        const res = await fetcher.fetch(url);
        return createPage({
          data: res,
        });
      }

      // start new session
      log.info(`[fetcher-session] starting new session for '${url}'`);
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
    },
  };
  return session;
};

export const createContext = ({
  sourceId,
  logger = defaultLogger,
  skipCache,
}: {
  sourceId: string;
  logger?: Logger;
  skipCache?: boolean;
}): SourceContext => {
  const source = Sources.find((s) => s.id === sourceId);
  if (!source) {
    throw new Error(`Source '${sourceId}' not found`);
  }

  const context: SourceContext = {
    logger,
    initFetcherSession: async (options) => {
      const sessionId = options?.sessionId ?? sourceId;
      const prevSession =
        skipCache || !options?.ignorePrevSession
          ? await FetchSessionRepo.get.byKey(sessionId)
          : undefined;
      return createFetcherSession(sessionId, prevSession, {
        ...options,
        baseUrl: options?.baseUrl ?? source.url,
      });
    },
    books: {
      upsert: async (items) => {
        const log = logger.scope('book-upsert');
        await SourceRepo.ensureCreated(sourceId);

        //#region Book upsert
        const itemsWithSourceBookId = await BookRepo.upsertFromSource(
          sourceId,
          items,
          log,
        );

        const { sourceBookIdToBookId } = await SourceRepo.books.syncBooks(
          sourceId,
          uniq(itemsWithSourceBookId.map((item) => item.source_book_id)),
        );

        //#region Upsert chapters
        for (const sourceBook of itemsWithSourceBookId) {
          if (!sourceBook.chapters?.length) {
            continue;
          }

          const { chapters } = sourceBook;

          const existingChapters = await SourceRepo.chapters.get.listByNumbers({
            sourceId,
            sourceBookId: sourceBook.id,
            chapterIds: sourceBook.chapters.map((i) => i.id),
          });
          const existingByNumber = keyBy(existingChapters, (c) => c.chapter_id);
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

          const bookId = sourceBookIdToBookId[sourceBook.source_book_id];
          if (bookId) {
            await UserStateRepo.sync.onBookChapterUpdated({
              bookId,
            });
          } else {
            log.warn(`bookId not found for sourceBookId ${sourceBook.id}`);
          }
          if (toCreate.length) {
            log.info(`${sourceId}/${sourceBook.id} ${msg}`);
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
