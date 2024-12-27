import { db } from 'data/db';
import { FetchSession } from 'data/schemas';
import { eq } from 'drizzle-orm';

export const FetchSessionRepo = {
  get: {
    byKey: async (key: string) => {
      return db.query.FetchSession.findFirst({
        where: eq(FetchSession.key, key),
      });
    },
  },
  create: async (value: (typeof FetchSession)['$inferInsert']) => {
    const [inserted] = await db
      .insert(FetchSession)
      .values(value)
      .returning()
      .onConflictDoUpdate({
        target: FetchSession.key,
        set: value,
      });
    return inserted;
  },
  delete: async (key: string) => {
    await db.delete(FetchSession).where(eq(FetchSession.key, key));
  },
};
