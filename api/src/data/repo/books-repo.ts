import { db } from 'data/db';
import { Book, Chapter } from 'data/schema';
import { and, desc, eq } from 'drizzle-orm';

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
