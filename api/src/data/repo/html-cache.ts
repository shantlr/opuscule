import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { HtmlCache } from '../schema.js';

export const HtmlCacheRepo = {
  async get(url: string, date = new Date()) {
    date.setMinutes(0, 0, 0);
    const key = `${date.valueOf()}:${url}`;
    return await db.query.HtmlCache.findFirst({
      where: eq(HtmlCache.key, key),
    });
  },
  async create(url: string, data: string, status: number, date = new Date()) {
    date.setMinutes(0, 0, 0);
    const key = `${date.valueOf()}:${url}`;
    return await db.insert(HtmlCache).values({
      data,
      status,
      key,
    });
  },
};
