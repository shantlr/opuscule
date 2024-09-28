import { db } from 'data/db';
import { Book } from 'data/schema';
import { desc, eq } from 'drizzle-orm';

export const BookRepo = {
  get: {
    byId: async (id: string) => {
      return await db.query.Book.findFirst({
        where: eq(Book.id, id),
      });
    },
    latestUpdateds: async () => {
      return await db.query.Book.findMany({
        orderBy: [desc(Book.last_chapter_updated_at)],
      });
    },
    // latestChapters: async () => {
    //   await db.query.Chapter.findMany({
    //     orderBy: [desc(Chapter.published_at)],
    //   });
    // },
  },
  sync: async (bookId: string) => {},
};
