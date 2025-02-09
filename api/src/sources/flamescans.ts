import { ACCURACY } from 'config/constants';
import { SourceRepo } from 'data/repo/source';
import { joinUrl } from 'lib/utils/join-url';
import { parseFullFormattedDate } from 'lib/utils/parse-formatted-date';
import { parseFormattedRelativeDate } from 'lib/utils/parse-relative-date';
import { fetchPictures } from 'sources/lib/fetch-pictures';
import { z } from 'zod';

import { ISource } from './types';

const bookIdRegex = /\/series\/(?<id>[^/]+)\/?$/;
const bookIdSchema = z
  .string()
  .regex(bookIdRegex)
  .transform((v) => {
    const m = v.match(bookIdRegex);
    return m?.groups?.id as string;
  });

const bookKeySchema = bookIdSchema;

// const chapterIdRegex = /-chapter?-(?<id>\d+(-\d+)?)+\/?$/;
const chapterIdRegex = /series\/[^/]+\/(?<id>[^/]+)/;
// const chapterRankRegex = chapterIdRegex;

const chapterIdSchema = z
  .string()
  .regex(chapterIdRegex)
  .transform((v) => {
    const m = v.match(chapterIdRegex);
    return m?.groups?.id as string;
  });
const chapterRankSchema = z.string().transform((v) => {
  const m = v.match(/Chapter (?<rank>\d+(\.\d+)?)/);
  if (m?.groups?.rank) {
    return Number(m.groups.rank);
  }

  throw new Error(`Failed to extract rank from chapter title '${v}'`);
});

export const sourceFlamescans: ISource<'flamescans'> = {
  id: 'flamescans',
  name: 'Flame Scans',
  url: 'https://flamecomics.xyz/',
  formatChapterUrl: ({ sourceBookKey, chapterId }) =>
    `${sourceFlamescans.url}/${sourceBookKey}-chapter-${chapterId}`,
  entries: {
    fetchLatests: async (context) => {
      const session = await context.initFetcherSession({
        baseUrl: sourceFlamescans.url,
        ignorePrevSession: true,
      });

      const page = await session.go('/');

      const items = page.map({
        type: 'map',
        query:
          '.mantine-Grid-root > .mantine-Grid-inner .mantine-Grid-col > div > .mantine-Group-root:not([spacing="xs"])',
        item: {
          coverUrl: {
            type: 'attr',
            query: 'a > div > img',
            name: 'src',
          },
          title: {
            type: 'text',
            query:
              '.mantine-Stack-root > a.mantine-Text-root.mantine-focus-auto[data-line-clamp="true"]',
          },
          url: {
            type: 'attr',
            query: 'a',
            name: 'href',
          },
          chapters: {
            type: 'map',
            query:
              '.mantine-Stack-root > .mantine-Stack-root:nth-child(2) > a.mantine-focus-auto.mantine-Text-root:not([data-size="sm"])',
            item: {
              url: {
                type: 'attr',
                name: 'href',
              },
              title: {
                type: 'text',
                query: '.mantine-Group-root > p:nth-child(1)',
              },
              publishedAt: {
                type: 'text',
                query: '.mantine-Group-root > p:nth-child(2)',
              },
            },
          },
        },
      });

      if (items.length === 0) {
        throw new Error('No items found');
      }

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
            coverUrl: z
              .string()
              .transform((path) => joinUrl(sourceFlamescans.url, path)),
            title: z.string().trim(),
            chapters: z.preprocess(
              (chapters) => {
                return (chapters as (typeof items)[number]['chapters'])
                  .filter((item) => !!item.title)
                  .map((chapter) => ({
                    ...chapter,
                    id: chapter.url,
                    rank: chapter.title,
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
                    rank: item.title,
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
          sourceFlamescans.formatChapterUrl({
            sourceBookKey: sourceBook.source_book_key,
            chapterId,
          }),
          // `/${sourceBook?.source_book_key}-chapter-${chapterId}`,
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
};
