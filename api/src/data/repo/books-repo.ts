import { db } from 'data/db';
import { Book } from 'data/schema';
import { desc } from 'drizzle-orm';

export const BookRepo = {
  get: {
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
