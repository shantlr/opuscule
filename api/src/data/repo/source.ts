import { and, eq, gte, inArray, isNull, lt, lte, or } from 'drizzle-orm';
import { db } from '../db.js';
import { Book, Chapter, Source, SourceBook } from '../schema.js';
import { Sources } from '../../sources/index.js';
import { maxBy, partition } from 'lodash';
import { BookRepo } from './books-repo.js';
import { ACCURACY } from 'config/constants.js';
import { GlobalSettingsRepo } from './global-settings.js';
import { defaultLogger, Logger } from 'config/logger.js';

export const SourceRepo = {
  get: {
    sourceToFetchLatests: async (opt?: { force?: boolean }) => {
      const globalSettings = (await GlobalSettingsRepo.get())!;
      const sources = !opt?.force
        ? await db.query.Source.findMany({
            where: or(
              isNull(Source.last_fetched_latests_at),
              lte(
                Source.last_fetched_latests_at,
                new Date(
                  Date.now() - globalSettings.fetch_latests_min_delay_ms,
                ),
              ),
            ),
          })
        : db.query.Source.findMany({});
      return sources;
    },
    listSubscribed: async () => {
      return db.query.Source.findMany({});
    },
  },

  ensureCreated: async (sourceId: string) => {
    await db
      .insert(Source)
      .values({
        id: sourceId,
        last_fetched_latests_at: null,
      })
      .onConflictDoNothing({
        target: [Source.id],
      });
  },

  updates: {
    subscribe: async (sourceId: string, logger = defaultLogger) => {
      await db.transaction(async (t) => {
        if (!Sources.find((s) => s.id === sourceId)) {
          throw new Error(`UNKNOWN_SOURCE`);
        }
        const existing = await t.query.Source.findFirst({
          where: eq(Source.id, sourceId),
        });
        if (existing) {
          return;
        }

        await t.insert(Source).values({
          id: sourceId,
          last_fetched_latests_at: null,
        });
      });
      logger.info(`[source] subscribed: ${sourceId}`);
    },
    unsubscribe: async (sourceId: string, logger = defaultLogger) => {
      await db.transaction(async (t) => {
        const existing = await t.query.Source.findFirst({
          where: eq(Source.id, sourceId),
        });
        if (existing) {
          await t.delete(Source).where(eq(Source.id, sourceId));
        }
      });
      logger.info(`[source] unsubscribed: ${sourceId}`);
    },
    fetchLatests: {
      done: async (sourceId: string) => {
        await db
          .update(Source)
          .set({
            last_fetched_latests_at: new Date(),
          })
          .where(eq(Source.id, sourceId));
      },
    },
  },

  books: {
    get: {
      byId: async (sourceId: string, sourceBookId: string) => {
        return db.query.SourceBook.findFirst({
          where: and(
            eq(SourceBook.source_id, sourceId),
            eq(SourceBook.source_book_id, sourceBookId),
          ),
        });
      },
      listById: async (sourceId: string, ids: string[]) => {
        if (!ids.length) {
          return [];
        }

        return db.query.SourceBook.findMany({
          where: and(
            eq(SourceBook.source_id, sourceId),
            inArray(SourceBook.source_book_id, ids),
          ),
        });
      },
      subscribedSourceOfBook: async (bookId: string) => {
        return db.query.SourceBook.findMany({
          where: and(eq(SourceBook.book_id, bookId)),
          with: {
            source: true,
          },
        });
      },
    },

    update: {
      title: async ({
        sourceBookId,
        sourceId,
        title,
        titleAccuracy,
      }: {
        sourceId: string;
        sourceBookId: string;
        title: string;
        titleAccuracy?: number;
      }) => {
        const res = await db
          .update(SourceBook)
          .set({
            title: title,
            title_accuracy: titleAccuracy,
          })
          .where(
            and(
              eq(SourceBook.source_id, sourceId),
              eq(SourceBook.source_book_id, sourceBookId),
              or(
                isNull(SourceBook.title_accuracy),
                lte(SourceBook.title_accuracy, titleAccuracy ?? ACCURACY.LOW),
              ),
            ),
          );
        return {
          updated: res.changes > 0,
        };
      },
      key: async ({
        sourceBookId,
        sourceId,
        key,
      }: {
        sourceId: string;
        sourceBookId: string;
        key: string;
      }) => {
        const res = await db
          .update(SourceBook)
          .set({
            source_book_key: key,
          })
          .where(
            and(
              eq(SourceBook.source_id, sourceId),
              eq(SourceBook.source_book_id, sourceBookId),
            ),
          );
        return {
          updated: res.changes > 0,
        };
      },
      description: async ({
        sourceBookId,
        sourceId,
        description,
        descriptionAccuracy,
      }: {
        sourceId: string;
        sourceBookId: string;
        description: string;
        descriptionAccuracy?: number;
      }) => {
        const res = await db
          .update(SourceBook)
          .set({
            description: description,
            description_accuracy: descriptionAccuracy,
          })
          .where(
            and(
              eq(SourceBook.source_id, sourceId),
              eq(SourceBook.source_book_id, sourceBookId),
              or(
                isNull(SourceBook.description_accuracy),
                lte(
                  SourceBook.description_accuracy,
                  descriptionAccuracy ?? ACCURACY.LOW,
                ),
              ),
            ),
          );
        return {
          updated: res.changes > 0,
        };
      },
      cover: async ({
        sourceId,
        bookId,
        coverUrl,
        coverOriginUrl,
      }: {
        sourceId: string;
        bookId: string;
        coverUrl: string;
        coverOriginUrl: string;
      }) => {
        await db
          .update(SourceBook)
          .set({
            cover_url: coverUrl,
            cover_origin_url: coverOriginUrl,
          })
          .where(
            and(
              eq(SourceBook.source_id, sourceId),
              eq(SourceBook.source_book_id, bookId),
            ),
          );
      },
    },
    updates: async (
      sourceId: string,
      items: {
        id: string;
        key?: string;
        title?: string;
        titleAccuracy?: number;
        description?: string;
        descriptionAccuracy?: number;
      }[],
    ) => {
      for (const item of items) {
        let updated = false;
        if (item.title) {
          const res = await SourceRepo.books.update.title({
            sourceId,
            sourceBookId: item.id,
            title: item.title,
            titleAccuracy: item.titleAccuracy,
          });
          updated = updated || res.updated;
        }
        if (item.key) {
          const res = await SourceRepo.books.update.key({
            sourceId,
            sourceBookId: item.id,
            key: item.key,
          });
          updated = updated || res.updated;
        }
        if (item.description) {
          const res = await SourceRepo.books.update.description({
            sourceId,
            sourceBookId: item.id,
            description: item.description,
            descriptionAccuracy: item.descriptionAccuracy,
          });
          updated = updated || res.updated;
        }
      }
    },
    creates: async (
      sourceId: string,
      items: {
        id: string;
        key?: string;
        title: string;
        titleAccuracy?: number;
        description?: string;
        descriptionAccuracy?: number;
        detailsFetchedAt?: Date | null;
      }[],
    ) => {
      if (!items.length) {
        return;
      }

      await db.insert(SourceBook).values(
        items.map((item) => ({
          source_id: sourceId,
          source_book_id: item.id,
          source_book_key: item.key,
          title: item.title,
          title_accuracy: item.titleAccuracy ?? ACCURACY.LOW,
          description: item.description,
          description_accuracy: item.description
            ? (item.descriptionAccuracy ?? ACCURACY.LOW)
            : null,
        })),
      );
    },

    createAssociatedBook: async (sb: (typeof SourceBook)['$inferSelect']) => {
      await db.transaction(async (t) => {
        const [book] = await t
          .insert(Book)
          .values({
            title: sb.title,
            cover_url: sb.cover_url,
            description: sb.description,
          })
          .returning();
        await t
          .update(SourceBook)
          .set({
            book_id: book.id,
          })
          .where(
            and(
              eq(SourceBook.source_id, sb.source_id),
              eq(SourceBook.source_book_id, sb.source_book_id),
            ),
          );
      });
    },
    syncBooks: async (
      sourceId: string,
      ids: string[],
      logger = defaultLogger,
    ) => {
      if (!ids.length) {
        return;
      }

      logger.info(`[source-book] sync books: ${sourceId}/${ids.join(',')}`);

      const sourceBooks = await db.query.SourceBook.findMany({
        where: inArray(SourceBook.source_book_id, ids),
      });
      const [withoutBooks, withBooks] = partition(
        sourceBooks,
        (sb) => !sb.book_id,
      );

      for (const sb of withoutBooks) {
        await SourceRepo.books.createAssociatedBook(sb);
        logger.info(
          `[source-book] associated book created: ${sb.source_id}/${sb.source_book_id}`,
        );
      }
      for (const b of withBooks) {
        await BookRepo.sync(b.book_id!);
      }
    },
  },
  chapters: {
    get: {
      listByNumbers: ({
        sourceId,
        sourceBookId,
        chapterIds,
      }: {
        sourceId: string;
        sourceBookId: string;
        chapterIds: string[];
      }) => {
        return db.query.Chapter.findMany({
          where: and(
            eq(Chapter.source_id, sourceId),
            eq(Chapter.source_book_id, sourceBookId),
            inArray(Chapter.chapter_id, chapterIds),
          ),
        });
      },
    },
    creates: async ({
      sourceId,
      sourceBookId,
      chapters,
      logger = defaultLogger,
    }: {
      sourceId: string;
      sourceBookId: string;
      chapters: {
        id: string;
        rank: number;
        publishedAt?: Date | null;
        publishedAtAccuracy?: number;
      }[];
      logger?: Logger;
    }) => {
      if (!chapters.length) {
        return;
      }

      await db.transaction(async (t) => {
        try {
          await t.insert(Chapter).values(
            chapters.map((c) => ({
              source_id: sourceId,
              chapter_id: c.id,
              chapter_rank: c.rank,
              source_book_id: sourceBookId,
              published_at: c.publishedAt,
              publishedAtAccuracy: c.publishedAtAccuracy ?? ACCURACY.LOW,
            })),
          );
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.startsWith('UNIQUE constraint failed:')
          ) {
            logger.error(
              `[source-chapter] create failed: ${sourceId}/${sourceBookId}/${chapters.map((c) => c.id).join(',')}`,
            );
          }
          throw err;
        }

        // Update last chapter updated at
        const lastPublished = maxBy(chapters, (c) => c.publishedAt?.valueOf());

        const lastPublishedAt = lastPublished?.publishedAt || new Date();

        const [updatedSourceBook] = await t
          .update(SourceBook)
          .set({
            last_chapter_updated_at: lastPublishedAt,
          })
          .where(
            and(
              eq(SourceBook.source_id, sourceId),
              eq(SourceBook.source_book_id, sourceBookId),
              eq(SourceBook.source_id, sourceId),
              or(
                lt(SourceBook.last_chapter_updated_at, lastPublishedAt),
                isNull(SourceBook.last_chapter_updated_at),
              ),
            ),
          )
          .returning();

        if (
          updatedSourceBook?.last_chapter_updated_at &&
          updatedSourceBook.book_id
        ) {
          await t
            .update(Book)
            .set({
              last_chapter_updated_at:
                updatedSourceBook.last_chapter_updated_at,
            })
            .where(
              and(
                eq(Book.id, updatedSourceBook.book_id),
                or(
                  lt(
                    Book.last_chapter_updated_at,
                    updatedSourceBook.last_chapter_updated_at,
                  ),
                  isNull(Book.last_chapter_updated_at),
                ),
              ),
            );
        }
      });
    },
    updates: async ({
      sourceId,
      sourceBookId,
      chapters,
    }: {
      sourceId: string;
      sourceBookId: string;
      chapters: {
        id: string;
        publishedAt?: Date | null;
        publishedAtAccuracy?: number | null;
      }[];
    }) => {
      for (const chapter of chapters) {
        if (chapter.publishedAt) {
          await db
            .update(Chapter)
            .set({
              published_at: chapter.publishedAt,
              published_at_accuracy:
                chapter.publishedAtAccuracy ?? ACCURACY.LOW,
            })
            .where(
              and(
                eq(Chapter.source_id, sourceId),
                eq(Chapter.source_book_id, sourceBookId),
                eq(Chapter.chapter_id, chapter.id),
                or(
                  isNull(Chapter.published_at),
                  isNull(Chapter.published_at_accuracy),
                  gte(
                    Chapter.published_at_accuracy,
                    chapter.publishedAtAccuracy ?? ACCURACY.LOW,
                  ),
                ),
              ),
            );
        }
      }
    },
  },
};
