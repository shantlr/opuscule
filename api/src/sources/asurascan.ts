import { ACCURACY } from 'config/constants';
import { SourceRepo } from 'data/repo/source';
import { fetchPictures } from 'lib/cron-jobs/core/fetch-pictures';
import { joinUrl } from 'lib/utils/join-url';
import { parseFullFormattedDate } from 'lib/utils/parse-formatted-date';
import { parseFormattedRelativeDate } from 'lib/utils/parse-relative-date';
import { uniqBy } from 'lodash';
import { z } from 'zod';

import { ISource } from './types';

export const sourceAsuraScan = {
  id: 'asurascan',
  name: 'Asura Scan',
  url: 'https://asuracomic.net',

  entries: {
    fetchLatests: async (context) => {
      const session = await context.initFetcherSession({
        baseUrl: sourceAsuraScan.url,
      });
      const page = await session.go('/');
      const items = page.map({
        type: 'map',
        query: '.w-full.p-1.pt-1.pb-3',
        item: {
          url: {
            type: 'attr',
            debug: true,
            name: 'href',
            query: `div.h-32.relative > a`,
          },
          coverUrl: {
            type: 'attr',
            query: 'a > img.object-cover',
            // query: {
            //   or: ['a > img.object-cover', 'a > img[alt="poster"]'],
            // },
            name: 'src',
          },
          title: {
            type: 'text',
            query: '.col-span-9 > .font-medium',
          },
          chapters: {
            type: 'map',
            query: '.col-span-9 .list-disc > span',
            item: {
              chapter: {
                type: 'text',
                query: 'a',
              },
              publishedAt: {
                type: 'text',
                query: 'p.items-end',
              },
              url: {
                type: 'attr',
                name: 'href',
                query: 'a',
              },
            },
          },
        },
      });

      const parsedItems = z
        .object({
          id: z
            .string()
            .transform((id) => id.split('-').slice(0, -1).join('-')),
          key: z.string(),
          url: z.string().transform((url) => joinUrl(sourceAsuraScan.url, url)),
          coverUrl: z
            .string()
            .transform((url) => joinUrl(sourceAsuraScan.url, url)),
          title: z.string().transform((t) => t.trim()),
          chapters: z
            .object({
              publishedAt: z
                .string()
                .transform((d) => parseFormattedRelativeDate(d)),
              id: z.string(),
              rank: z.number(),
              url: z
                .string()
                .transform((url) => joinUrl(sourceAsuraScan.url, url)),
            })
            .array(),
        })
        .array()
        .parse(
          items.map((item) => ({
            ...item,
            id: item.url.match(/\/series\/(?<id>[^/]+)/)?.groups?.id as string,
            key: item.url.match(/\/series\/(?<id>[^/]+)/)?.groups?.id as string,
            chapters: item.chapters.map((chapt) => ({
              url: chapt.url,
              id: chapt.url.match(/\/chapter\/(?<chapter>[^/]+)/)?.groups
                ?.chapter as string,
              rank: parseFloat(
                chapt.url.match(/\/chapter\/(?<chapter>[^/]+)/)?.groups
                  ?.chapter as string,
              ),
              publishedAt: chapt.publishedAt,
            })),
          })),
        );

      await context.books.upsert(
        parsedItems.map((item) => ({
          ...item,
          chapters: item.chapters.map((chapt) => ({
            ...chapt,
            publishedAccuracy: ACCURACY.MEDIUM,
          })),
        })),
      );
    },
    book: {
      details: async ({ sourceBookId }, context) => {
        const sourceBook = await SourceRepo.books.get.byId(
          sourceAsuraScan.id,
          sourceBookId,
        );

        const session = await context.initFetcherSession();
        const page = await session.go(`/series/${sourceBook?.source_book_key}`);
        const res = page.map({
          type: 'object',
          fields: {
            title: {
              type: 'text',
              query: 'div.text-center > span.text-xl.font-bold',
            },
            // author: {
            //   type: 'text',
            //   query: ''
            // },
            coverUrl: {
              type: 'attr',
              query: 'img[alt="poster"]',
              name: 'src',
            },
            rating: {
              type: 'text',
              query: 'div.col-span-12 > div.space-y-1\\.5 > div > p',
            },
            status: {
              type: 'text',
              query:
                'div.col-span-12 > div.space-y-1\\.5 > div > div:nth-child(1) > h3:nth-child(2)',
            },
            description: {
              type: 'text',
              query: 'div.col-span-12 > span.font-medium.text-sm',
            },

            chapters: {
              type: 'map',
              query:
                'div > div.overflow-y-auto.scrollbar-thumb-themecolor > div.pl-4.py-2.border',
              item: {
                title: {
                  type: 'text',
                  query: 'h3 > a',
                },
                url: {
                  type: 'attr',
                  query: 'h3 > a',
                  name: 'href',
                },
                publishedAt: {
                  type: 'text',
                  query: 'h3.text-xs',
                },
              },
            },
          },
        });

        const parsedBook = z
          .object({
            title: z.string(),
            coverUrl: z.string(),
            // rating: z.string(),
            // status: z.string(),
            description: z.string(),
            chapters: z
              .object({
                id: z.string(),
                rank: z.number(),
                title: z.string(),
                url: z.string(),
                publishedAt: z.string().transform((d) => {
                  return parseFullFormattedDate(d);
                }),
              })
              .array(),
          })
          .parse({
            ...res,
            titleAccuracy: ACCURACY.HIGH,
            descriptionAccuracy: ACCURACY.HIGH,
            chapters: uniqBy(
              res.chapters.map((chapt) => ({
                ...chapt,
                id: chapt.url.match(/\/chapter\/(?<id>[^/]+)/)?.groups?.id,
                rank: Number(
                  chapt.url.match(/\/chapter\/(?<id>[^/]+)/)?.groups?.id,
                ),
              })),
              (c) => c.id,
            ),
          });

        await context.books.upsert([
          {
            id: sourceBookId,
            titleAccuracy: ACCURACY.HIGH,
            descriptionAccuracy: ACCURACY.HIGH,
            ...parsedBook,
            chapters: parsedBook.chapters.map((c) => ({
              ...c,
              publishedAccuracy: ACCURACY.LOW,
            })),
          },
        ]);
      },
      fetchChapter: async ({ sourceBookId, chapterId }, context) => {
        const sourceBook = await SourceRepo.books.get.byId(
          sourceAsuraScan.id,
          sourceBookId,
        );
        const session = await context.initFetcherSession();
        const page = await session.go(
          `/series/${sourceBook?.source_book_key}/chapter/${chapterId}`,
        );

        const res = page.map({
          type: 'object',
          fields: {
            pages: {
              type: 'map',
              query: 'div.py-8 > div.w-full.mx-auto.center',
              item: {
                url: {
                  type: 'attr',
                  query: `img.object-cover.mx-auto`,
                  name: 'src',
                },
              },
            },
          },
        });

        const results = z
          .object({
            pages: z
              .object({
                url: z.string(),
              })
              .array()
              .min(1),
          })
          .parse(res);

        await fetchPictures([
          {
            type: 'chapter_pages',
            source_id: sourceAsuraScan.id,
            source_book_id: sourceBookId,
            source_chapter_id: chapterId,
            pages: results.pages,
          },
        ]);
      },
    },
  },
} as const satisfies ISource;
