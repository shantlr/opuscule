import { Logger } from 'config/logger';
import { db } from 'data/db';
import { Book, UserBookState, Chapter, UserChapterState } from 'data/schemas';
import {
  SQL,
  and,
  count,
  desc,
  eq,
  inArray,
  notInArray,
  isNull,
  gt,
  sql,
  lt,
} from 'drizzle-orm';
import { fetchBook } from 'lib/cron-jobs/fetch-book';
import { keyBy } from 'lodash';
import { FetchPictureJob, fetchPictures } from 'sources/lib/fetch-pictures';

import { SourceRepo } from './source';
import { UserStateRepo } from './user-state';
import { shouldUpdateTextWithAccuracy } from './utils';

export const BookRepo = {
  get: {
    byId: async (id: string) => {
      return await db.query.Book.findFirst({
        where: eq(Book.id, id),
      });
    },
    byIdWithChapters: async ({
      id,
      userId,
    }: {
      id: string;
      userId: string;
    }) => {
      const book = await db.query.Book.findFirst({
        where: eq(Book.id, id),
        with: {
          sourceBooks: {
            with: {
              chapters: {
                orderBy: [desc(Chapter.chapter_rank)],
                columns: {
                  id: true,
                  chapter_id: true,
                  chapter_rank: true,
                  source_id: true,
                  published_at: true,
                },
              },
            },
          },
        },
      });
      if (!book) {
        return null;
      }

      const bookWithChapterState = book as Omit<typeof book, 'sourceBooks'> & {
        sourceBooks: (Omit<(typeof book)['sourceBooks'][number], 'chapters'> & {
          chapters: ((typeof book)['sourceBooks'][number]['chapters'][number] & {
            userState: Awaited<
              ReturnType<typeof UserStateRepo.get.userChapterStates>
            >[number];
          })[];
        })[];
      };

      const chapterIds = book.sourceBooks.flatMap((b) =>
        b.chapters.map((c) => c.id),
      );
      if (chapterIds.length) {
        const userChapterStates = await UserStateRepo.get.userChapterStates({
          userId,
          chapterIds,
        });
        const stateByChapterId = keyBy(
          userChapterStates,
          (ucs) => ucs.chapter_id,
        );
        bookWithChapterState.sourceBooks.forEach((sb) => {
          sb.chapters.forEach((c) => {
            c.userState = stateByChapterId[c.id];
          });
        });
      }

      return book;
    },
    latestUpdateds: async (query?: {
      bookIds?: string[];
      userId?: string;
      bookmarked?: boolean;
      hasUnread?: boolean;
    }) => {
      const cond: SQL[] = [];

      if (Array.isArray(query?.bookIds) && query.bookIds.length) {
        cond.push(inArray(Book.id, query.bookIds));
      }
      if (typeof query?.bookmarked === 'boolean' && query?.userId) {
        const bookmarked = await db.query.UserBookState.findMany({
          where: and(
            eq(UserBookState.bookmarked, true),
            eq(UserBookState.user_id, query.userId),
          ),
        });
        if (!bookmarked.length) {
          return [];
        }

        cond.push(
          (query?.bookmarked ? inArray : notInArray)(
            Book.id,
            bookmarked.map((b) => b.book_id),
          ),
        );
      }

      if (query?.hasUnread) {
        const res = await db.query.UserBookState.findMany({
          columns: {
            book_id: true,
          },
          where: and(
            gt(UserBookState.unread_count, 0),
            typeof query.bookmarked === 'boolean'
              ? eq(UserBookState.bookmarked, query.bookmarked)
              : undefined,
          ),
        });
        cond.push(
          inArray(
            Book.id,
            res.map((b) => b.book_id),
          ),
        );
      }

      return await db.query.Book.findMany({
        where: cond.length ? and(...cond) : undefined,
        orderBy: [desc(Book.last_chapter_updated_at)],
        with: {
          sourceBooks: {
            with: {
              chapters: {
                columns: {
                  chapter_id: true,
                  id: true,
                  chapter_rank: true,
                  published_at: true,
                },
                orderBy: [desc(Chapter.chapter_rank)],
                with: {
                  userState: true,
                },
                limit: 3,
              },
            },
          },
        },
      });
    },
    booksStates: async (sourceBookIds: string[]) => {
      return db
        .select({
          source_id: Chapter.source_id,
          source_book_id: Chapter.source_book_id,
          unread_count: count(),
        })
        .from(Chapter)
        .where(
          and(
            inArray(Chapter.source_book_id, sourceBookIds),
            isNull(UserChapterState.chapter_id),
          ),
        )
        .leftJoin(UserChapterState, eq(Chapter.id, UserChapterState.chapter_id))
        .groupBy(Chapter.source_id, Chapter.source_book_id);
    },
    byIdLatestUpdated: async (id: string) => {
      const res = await BookRepo.get.latestUpdateds({
        bookIds: [id],
      });
      return res[0];
    },
  },
  chapters: {
    get: {
      byId: async (id: string) => {
        return db.query.Chapter.findFirst({
          where: eq(Chapter.id, id),
        });
      },
      byIdWithReadProgress: async (id: string) => {
        return db.query.Chapter.findFirst({
          where: eq(Chapter.id, id),
          with: {
            userState: true,
          },
        });
      },
      nextByRank: async ({
        bookId,
        rank,
      }: {
        bookId: string;
        rank: number;
      }) => {
        return db.query.Chapter.findFirst({
          where: and(
            eq(Chapter.source_book_id, bookId),
            gt(Chapter.chapter_rank, rank),
          ),
          orderBy: [Chapter.chapter_rank],
        });
      },
      prevByRank: async ({
        bookId,
        rank,
      }: {
        bookId: string;
        rank: number;
      }) => {
        return db.query.Chapter.findFirst({
          where: and(
            eq(Chapter.source_book_id, bookId),
            lt(Chapter.chapter_rank, rank),
          ),
          orderBy: [desc(Chapter.chapter_rank)],
        });
      },
    },
    updates: {
      readProgressMany: async (
        chapters: {
          id: string;
          read: boolean;
          userId: string;
        }[],
      ) => {
        await db
          .insert(UserChapterState)
          .values(
            chapters.map((c) => ({
              chapter_id: c.id,
              read: c.read,
              user_id: c.userId,
              read_at: new Date(),
            })),
          )
          .onConflictDoUpdate({
            target: [UserChapterState.user_id, UserChapterState.chapter_id],
            set: {
              read: sql`excluded.read`,
              read_at: sql`COALESCE(${UserChapterState.read_at}, excluded.read_at)`,
            },
          });
      },
      readProgress: async ({
        userId,
        chapterId,
        percentage,
        page,
      }: {
        userId: string;
        chapterId: string;
        percentage: number;
        page: number;
      }) => {
        const read = percentage >= 0.99;
        const [updated] = await db
          .insert(UserChapterState)
          .values({
            user_id: userId,
            chapter_id: chapterId,
            percentage,
            current_page: page,
            read,
          })
          .onConflictDoUpdate({
            target: [UserChapterState.user_id, UserChapterState.chapter_id],
            set: {
              percentage,
              current_page: page,
              read,
            },
          })
          .returning();

        if (read) {
          if (!updated?.read_at) {
            await db
              .update(UserChapterState)
              .set({ read_at: new Date() })
              .where(eq(UserChapterState.chapter_id, chapterId));
          }
          await UserStateRepo.sync.onChapterReadDone({
            chapterId,
          });
        }
      },
      pages: async ({
        sourceBookId,
        sourceChapterId,
        pages,
      }: {
        sourceBookId: string;
        sourceChapterId: string;
        pages: {
          s3_key: string;
          s3_bucket: string;
          width: number;
          height: number;
        }[];
      }) => {
        await db
          .update(Chapter)
          .set({
            pages,
          })
          .where(
            and(
              eq(Chapter.source_book_id, sourceBookId),
              eq(Chapter.chapter_id, sourceChapterId),
            ),
          );
      },
    },
  },

  bookmark: {
    create: async ({ bookId, userId }: { bookId: string; userId: string }) => {
      const book = await db.query.Book.findFirst({
        where: eq(Book.id, bookId),
      });
      if (!book) {
        return { error: 'INVALID_BOOK' as const };
      }
      await db
        .insert(UserBookState)
        .values({
          user_id: userId,
          book_id: bookId,
          bookmarked: true,
        })
        .onConflictDoUpdate({
          target: [UserBookState.user_id, UserBookState.book_id],
          set: {
            bookmarked: true,
          },
        });

      await UserStateRepo.sync.booksUnreadCount({ bookIds: [bookId] });
      await BookRepo.refetch.book(bookId);
      return {};
    },
    delete: async ({ bookId, userId }: { bookId: string; userId: string }) => {
      const book = await db.query.Book.findFirst({
        where: eq(Book.id, bookId),
      });
      if (!book) {
        return { error: 'INVALID_BOOK' as const };
      }

      await db
        .insert(UserBookState)
        .values({
          user_id: userId,
          book_id: bookId,
          bookmarked: false,
        })
        .onConflictDoUpdate({
          target: [UserBookState.user_id, UserBookState.book_id],
          set: {
            bookmarked: false,
          },
        });
      return {};
    },
  },

  userStates: {
    list: ({ userId, bookIds }: { userId: string; bookIds: string[] }) => {
      if (!bookIds.length) {
        return [];
      }
      return db.query.UserBookState.findMany({
        where: and(
          eq(UserBookState.user_id, userId),
          inArray(UserBookState.book_id, bookIds),
        ),
      });
    },
    get: {
      byId: async ({ userId, bookId }: { bookId: string; userId: string }) => {
        return db.query.UserBookState.findFirst({
          where: and(
            eq(UserBookState.book_id, bookId),
            eq(UserBookState.user_id, userId),
          ),
        });
      },
    },
  },

  refetch: {
    book: async (bookId: string) => {
      await fetchBook(bookId);
    },
  },

  upsertFromSource: async <
    ItemType extends {
      id: string;
      title?: string;
      titleAccuracy?: number;
      coverUrl?: string | null;
      description?: string;
      descriptionAccuracy?: number;
    },
  >(
    sourceId: string,
    items: ItemType[],
    logger: Logger,
  ): Promise<
    (Omit<ItemType, 'source_book_id'> & { source_book_id: string })[]
  > => {
    const existings = await SourceRepo.books.get.listById(
      sourceId,
      items.map((i) => i.id),
    );

    const existingById = keyBy(existings, (b) => b.source_book_id);

    const { missings, matched, coverToFetches, toUpdate } = items.reduce(
      (acc, item) => {
        const existing = existingById[item.id];
        if (!existing) {
          if (item.title) {
            acc.missings.push(item as ItemType & { title: string });
          }
        } else {
          acc.matched.push({
            ...item,
            source_book_id: existing.source_book_id,
          });

          if (
            shouldUpdateTextWithAccuracy(
              [existing.title, existing.title_accuracy],
              [item.title, item.titleAccuracy],
            ) ||
            shouldUpdateTextWithAccuracy(
              [existing.description, existing.description_accuracy],
              [item.description, item.descriptionAccuracy],
            )
          ) {
            acc.toUpdate.push(item);
          }
        }

        if (
          (item.title || existing) &&
          item.coverUrl &&
          existing?.cover_origin_url !== item.coverUrl
        ) {
          acc.coverToFetches.push({
            type: 'source_book_cover',
            source_id: sourceId,
            source_book_id: item.id,
            img_url: item.coverUrl,
          });
        }

        return acc;
      },
      {
        missings: [] as (ItemType & { title: string })[],
        matched: [] as (ItemType & { source_book_id: string })[],
        toUpdate: [] as ItemType[],
        coverToFetches: [] as FetchPictureJob[],
      },
    );

    await SourceRepo.books.creates(sourceId, missings);
    await SourceRepo.books.updates(sourceId, toUpdate);

    await fetchPictures(coverToFetches, { logger });

    logger.info(
      `${items.length} input items | ${missings.length} created | ${toUpdate.length} updated`,
    );
    return [
      ...missings.map((b) => ({
        ...b,
        source_book_id: b.id,
      })),
      ...matched,
    ];
  },

  update: {
    lastDetailsFetched: async (id: string, date: Date) => {
      await db
        .update(Book)
        .set({
          last_detail_updated_at: date,
        })
        .where(eq(Book.id, id));
    },
  },
  sync: async (bookId: string) => {},
};
