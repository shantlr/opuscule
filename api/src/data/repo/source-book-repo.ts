import { db } from 'data/db';
import { SourceBook } from 'data/schemas';
import { eq } from 'drizzle-orm';

export const SourceBookRepo = {
  get: {
    byId: async (id: string) => {
      return db.query.SourceBook.findFirst({
        where: eq(SourceBook.source_book_id, id),
      });
    },
  },
};
