import { db } from 'data/db';
import { Book, UserBookState, Chapter } from 'data/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';

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
              },
            },
          },
        },
      });
    },
    latestUpdateds: async () => {
      return await db.query.Book.findMany({
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
    },
    updates: {
      pages: async ({
        sourceBookId,
        sourceChapterId,
        pages,
      }: {
        sourceBookId: string;
        sourceChapterId: string;
        pages: { url: string }[];
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
