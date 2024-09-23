import { db } from 'data/db';
import { FetchPicturesJob } from 'data/schema';
import { asc } from 'drizzle-orm';

export const FetchPicuresJobRepo = {
  get: {
    async next() {
      const next = await db.query.FetchPicturesJob.findFirst({
        orderBy: [asc(FetchPicturesJob.created_at)],
      });
      return next;
    },
  },
};
