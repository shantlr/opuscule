import { ACCURACY } from 'config/constants';
import { defaultLogger, Logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { FetchSessionRepo } from 'data/repo/fetch-sessions';
import { SourceRepo } from 'data/repo/source';
import { UserStateRepo } from 'data/repo/user-state';
import { keyBy, sortBy, uniq } from 'lodash';
import { Sources } from 'sources';

import { FetcherSession, SourceContext } from '../types';

import { createPlaywrightFetcher } from './playwright-fetcher';

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

  const fetchers: FetcherSession[] = [];

  const context: SourceContext = {
    logger,
    initFetcherSession: async (options) => {
      const sessionId = options?.sessionId ?? sourceId;
      const prevSession =
        skipCache || !options?.ignorePrevSession
          ? await FetchSessionRepo.get.byKey(sessionId)
          : undefined;

      const fetcherSession = await createPlaywrightFetcher({
        baseUrl: options?.baseUrl ?? source.url,
      });
      // return createFetcherSession(sessionId, prevSession, {
      //   ...options,
      //   baseUrl: options?.baseUrl ?? source.url,
      // });
      fetchers.push(fetcherSession);
      return fetcherSession;
    },
    books: {
      upsert: async (items) => {
        const log = logger.scope('book-upsert');

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
    close: async () => {
      await Promise.all(fetchers.map((f) => f.close?.()));
    },
  };
  return context;
};
