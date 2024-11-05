import { db } from 'data/db';
import { Book, UserBookState, Chapter, UserChapterState } from 'data/schema';
import { SQL, and, desc, eq, inArray, notInArray } from 'drizzle-orm';

export const BookRepo = {
  get: {
    byId: async (id: string) => {
      return await db.query.Book.findFirst({
        where: eq(Book.id, id),
      });
    },
    byIdWithChapters: async (id: string) => {
      return await db.query.Book.findFirst({
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
                with: {
                  userState: true,
                },
              },
            },
          },
        },
      });
    },
    latestUpdateds: async (query?: { bookmarked?: boolean }) => {
      const cond: SQL[] = [];

      if (typeof query?.bookmarked === 'boolean') {
        const bookmarked = await db.query.UserBookState.findMany({
          where: eq(UserBookState.bookmarked, true),
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
    },
    updates: {
      readProgress: async ({
        chapterId,
        percentage,
        page,
      }: {
        chapterId: string;
        percentage: number;
        page: number;
      }) => {
        await db
          .insert(UserChapterState)
          .values({
            chapter_id: chapterId,
            percentage,
            current_page: page,
          })
          .onConflictDoUpdate({
            target: UserChapterState.chapter_id,
            set: {
              percentage,
              current_page: page,
              read: percentage >= 0.99,
            },
          });
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
    create: async (bookId: string) => {
      const book = await db.query.Book.findFirst({
        where: eq(Book.id, bookId),
      });
      if (!book) {
        return { error: 'INVALID_BOOK' as const };
      }
      await db
        .insert(UserBookState)
        .values({
          book_id: bookId,
          bookmarked: true,
        })
        .onConflictDoUpdate({
          target: UserBookState.book_id,
          set: {
            bookmarked: true,
          },
        });
      return {};
    },
    delete: async (bookId: string) => {
      const book = await db.query.Book.findFirst({
        where: eq(Book.id, bookId),
      });
      if (!book) {
        return { error: 'INVALID_BOOK' as const };
      }

      await db
        .insert(UserBookState)
        .values({
          book_id: bookId,
          bookmarked: false,
        })
        .onConflictDoUpdate({
          target: UserBookState.book_id,
          set: {
            bookmarked: false,
          },
        });
      return {};
    },
  },

  userStates: {
    list: (bookIds: string[]) => {
      if (!bookIds.length) {
        return [];
      }
      return db.query.UserBookState.findMany({
        where: inArray(UserBookState.book_id, bookIds),
      });
    },
    get: {
      byId: async (bookId: string) => {
        return db.query.UserBookState.findFirst({
          where: eq(UserBookState.book_id, bookId),
        });
      },
    },
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
