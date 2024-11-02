import { z } from 'zod';
import { ISource } from './types';
import { parseFormattedRelativeDate } from 'lib/utils/parse-relative-date';
import { ACCURACY } from 'config/constants';
import { SourceRepo } from 'data/repo/source';
import { parseFullFormattedDate } from 'lib/utils/parse-formatted-date';
import { fetchPictures } from 'lib/cron-jobs/core/fetch-pictures';

const bookIdRegex = /\/series\/(?<id>[^/]+)\/?$/;
const bookIdSchema = z
  .string()
  .regex(bookIdRegex)
  .transform((v) => {
    const m = v.match(bookIdRegex);
    return m?.groups?.id as string;
  });

const bookKeySchema = bookIdSchema;

const chapterIdRegex = /-chapter?-(?<id>\d+(-\d+)?)+\/?$/;
const chapterRankRegex = chapterIdRegex;

const chapterIdSchema = z
  .string()
  .regex(chapterIdRegex)
  .transform((v) => {
    const m = v.match(chapterIdRegex);
    return m?.groups?.id as string;
  });
const chapterRankSchema = z
  .string()
  .regex(chapterRankRegex)
  .transform((v) => {
    const m = v.match(chapterRankRegex);
    return Number(m?.groups?.id?.replace('-', '.'));
  });

export const sourceFlamescans = {
  id: 'flamescans',
  name: 'Flame Scans',
  url: 'https://flamecomics.xyz/',
  entries: {
    fetchLatests: async (context) => {
      const session = await context.initFetcherSession({
        baseUrl: sourceFlamescans.url,
        ignorePrevSession: true,
      });

      const page = await session.go('/');

      const items = page.map({
        query: '.latest-updates > div',
        type: 'map',
        item: {
          url: {
            type: 'attr',
            name: 'href',
            query: '.bsx > a',
          },
          coverUrl: {
            type: 'attr',
            name: 'src',
            query: '.limit > img',
          },
          title: {
            type: 'text',
            query: '.info > a',
          },
          chapters: {
            type: 'map',
            query: '.chapter-list > a',
            item: {
              url: {
                type: 'attr',
                name: 'href',
              },
              title: {
                type: 'text',
                query: '.epxs',
              },
              publishedAt: {
                type: 'text',
                query: '.epxdate',
              },
            },
          },
        },
      });

      const parsedItems = z
        .preprocess(
          (v) => {
            const item = v as (typeof items)[number];
            return {
              ...item,
              id: item.url,
              key: item.url,
            };
          },
          z.object({
            id: bookIdSchema,
            key: bookKeySchema,
            url: z.string(),
            coverUrl: z.string(),
            title: z.string().trim(),
            chapters: z.preprocess(
              (chapters) => {
                return (chapters as (typeof items)[number]['chapters'])
                  .filter((item) => !!item.title)
                  .map((chapter) => ({
                    ...chapter,
                    id: chapter.url,
                    rank: chapter.url,
                  }));
              },
              z
                .object({
                  id: chapterIdSchema,
                  rank: chapterRankSchema,
                  url: z.string(),
                  title: z.string().trim(),
                  publishedAt: z
                    .string()
                    .trim()
                    .transform((v) => parseFormattedRelativeDate(v)),
                })
                .array(),
            ),
          }),
        )
        .array()
        .parse(items);

      await context.books.upsert(
        parsedItems.map((item) => ({
          ...item,
          titleAccuracy: ACCURACY.LOW,
          chapters: item.chapters.map((chapter) => ({
            ...chapter,
            publishedAccuracy: ACCURACY.MEDIUM,
          })),
        })),
      );
    },
    book: {
      details: async ({ sourceBookId }, context) => {
        const log = context.logger.scope('flamescans-book-details');
        // Fetch book details
        const sourceBook = await SourceRepo.books.get.byId(
          sourceFlamescans.id,
          sourceBookId,
        );
        if (!sourceBook) {
          log.warn(`source book not found '${sourceBookId}'`);
          return;
        }

        const session = await context.initFetcherSession();
        const page = await session.go(`/series/${sourceBook?.source_book_key}`);
        const res = page.map({
          type: 'object',
          fields: {
            coverUrl: {
              type: 'attr',
              query: 'div.thumb > img',
              name: 'src',
            },
            title: {
              type: 'text',
              query: '.titles > h1.entry-title',
            },
            description: {
              type: 'text',
              query: '.summary .entry-content',
            },
            chapters: {
              type: 'map',
              query: '#chapterlist > ul > li',
              item: {
                url: {
                  type: 'attr',
                  query: 'a',
                  name: 'href',
                },
                title: {
                  type: 'text',
                  query: '.chapternum',
                },
                publishedAt: {
                  type: 'text',
                  query: '.chapterdate',
                },
              },
            },
          },
        });

        const parsedRes = z
          .object({
            coverUrl: z.string(),
            title: z.string().trim(),
            description: z.string().trim(),
            chapters: z
              .preprocess(
                (v) => {
                  const item = v as (typeof res)['chapters'][number];
                  return {
                    ...item,
                    id: item.url,
                    rank: item.url,
                  };
                },
                z.object({
                  id: chapterIdSchema,
                  rank: chapterRankSchema,
                  publishedAt: z
                    .string()
                    .transform((v) => parseFullFormattedDate(v)),
                }),
              )
              .array(),
          })
          .parse(res);
        await context.books.upsert([
          {
            id: sourceBookId,
            key: sourceBook.source_book_key!,
            ...parsedRes,
            titleAccuracy: ACCURACY.HIGH,
            descriptionAccuracy: ACCURACY.HIGH,
            chapters: parsedRes.chapters.map((chapter) => ({
              ...chapter,
              publishedAccuracy: ACCURACY.LOW,
            })),
          },
        ]);
      },
      fetchChapter: async ({ sourceBookId, chapterId }, context) => {
        const log = context.logger.scope('flamescans-fetch-chapter');
        const sourceBook = await SourceRepo.books.get.byId(
          sourceFlamescans.id,
          sourceBookId,
        );
        if (!sourceBook) {
          log.warn(`source book not found '${sourceBookId}'`);
          return;
        }
        if (!sourceBook.source_book_key) {
          log.warn(`source book '${sourceBookId}' source_book_key is missing`);
          return;
        }

        const session = await context.initFetcherSession();
        const page = await session.go(
          `/${sourceBook?.source_book_key}-chapter-${chapterId}`,
        );
        const res = page.map({
          type: 'object',
          fields: {
            pages: {
              type: 'map',
              query: '#readerarea img.aligncenter',
              item: {
                url: {
                  type: 'attr',
                  name: 'src',
                },
              },
            },
          },
        });

        await fetchPictures([
          {
            type: 'chapter_pages',
            source_id: sourceFlamescans.id,
            source_book_id: sourceBookId,
            source_chapter_id: chapterId,
            pages: res.pages,
          },
        ]);
      },
    },
  },
} satisfies ISource;
