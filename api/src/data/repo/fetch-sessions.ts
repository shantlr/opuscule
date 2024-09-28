import { db } from 'data/db';
import { FetchSession } from 'data/schema';
import { eq } from 'drizzle-orm';

export const FetchSessionRepo = {
  get: {
    byKey: async (key: string) => {
      return db.query.FetchSession.findFirst({
        where: eq(FetchSession.key, key),
      });
    },
  },
  create: async (url: string, value: (typeof FetchSession)['$inferInsert']) => {
    const [inserted] = await db
      .insert(FetchSession)
      .values({
        ...value,
        cookies: value.cookies.map((cookie) => ({
          ...cookie,
          url,
        })),
      })
      .returning()
      .onConflictDoUpdate({
        target: FetchSession.key,
        set: value,
      });
    return inserted;
  },
};
