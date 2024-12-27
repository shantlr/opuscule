import { eq, like } from 'drizzle-orm';

import { db } from '../db.js';
import { HtmlCache } from '../schemas';

export const HtmlCacheRepo = {
  get: {
    async byUrl(url: string, date = new Date()) {
      date.setMinutes(0, 0, 0);
      const key = `${date.valueOf()}:${url}`;
      return await db.query.HtmlCache.findFirst({
        where: eq(HtmlCache.key, key),
      });
    },
    async lastByKey(key: string) {
      return await db.query.HtmlCache.findFirst({
        where: like(HtmlCache.key, `%:${key}`),
      });
    },
  },
  async create(url: string, data: string, status: number, date = new Date()) {
    date.setMinutes(0, 0, 0);
    const key = `${date.valueOf()}:${url}`;
    return await db
      .insert(HtmlCache)
      .values({
        data,
        status,
        key,
      })
      .onConflictDoUpdate({
        set: {
          data,
          status,
        },
        target: [HtmlCache.key],
      });
  },
};
