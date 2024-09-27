import { and, eq, inArray, isNull, lte, or } from 'drizzle-orm';
import { db } from '../db.js';
import { Book, Chapter, Source, SourceBook } from '../schema.js';
import { Sources } from '../../sources/index.js';
import { partition } from 'lodash';
import { BookRepo } from './books-repo.js';
import { ACCURACY } from 'config/constants.js';
import { GlobalSettingsRepo } from './global-settings.js';

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

  updates: {
    subscribe: async (sourceId: string) => {
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
      console.log(`[source] subscribed: ${sourceId}`);
    },
    unsubscribe: async (sourceId: string) => {
      await db.transaction(async (t) => {
        const existing = await t.query.Source.findFirst({
          where: eq(Source.id, sourceId),
        });
        if (existing) {
          await t.delete(Source).where(eq(Source.id, sourceId));
        }
      });
      console.log(`[source] unsubscribed: ${sourceId}`);
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
        await db
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
        await db
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
        title?: string;
        titleAccuracy?: number;
        description?: string;
        descriptionAccuracy?: number;
      }[],
    ) => {
      for (const item of items) {
        if (item.title) {
          await SourceRepo.books.update.title({
            sourceId,
            sourceBookId: item.id,
            title: item.title,
            titleAccuracy: item.titleAccuracy,
          });
        }
        if (item.description) {
          await SourceRepo.books.update.description({
            sourceId,
            sourceBookId: item.id,
            description: item.description,
            descriptionAccuracy: item.descriptionAccuracy,
          });
        }
      }
    },
    creates: async (
      sourceId: string,
      items: {
        id: string;
        title: string;
        titleAccuracy?: number;
        description?: string;
        descriptionAccuracy?: number;
      }[],
    ) => {
      if (!items.length) {
        return;
      }

      await db.insert(SourceBook).values(
        items.map((item) => ({
          source_id: sourceId,
          source_book_id: item.id,
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
    syncBooks: async (sourceId: string, ids: string[]) => {
      if (!ids.length) {
        return;
      }

      console.log(`[source-book] sync books: ${sourceId}/${ids.join(',')}`);

      const sourceBooks = await db.query.SourceBook.findMany({
        where: inArray(SourceBook.source_book_id, ids),
      });
      const [withoutBooks, withBooks] = partition(
        sourceBooks,
        (sb) => !sb.book_id,
      );

      for (const sb of withoutBooks) {
        await SourceRepo.books.createAssociatedBook(sb);
        console.log(
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
    }: {
      sourceId: string;
      sourceBookId: string;
      chapters: {
        id: string;
        rank: number;
        published_at?: Date | null;
      }[];
    }) => {
      if (!chapters.length) {
        return;
      }

      await db.insert(Chapter).values(
        chapters.map((c) => ({
          source_id: sourceId,
          chapter_id: c.id,
          chapter_rank: c.rank,
          source_book_id: sourceBookId,
          published_at: c.published_at,
        })),
      );
    },
  },
};
