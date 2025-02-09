import { ACCURACY } from 'config/constants';
import { SourceRepo } from 'data/repo/source';
import { joinUrl } from 'lib/utils/join-url';
import { parseFullFormattedDate } from 'lib/utils/parse-formatted-date';
import { fetchPictures } from 'sources/lib/fetch-pictures';
import { z } from 'zod';

import { ISource } from './types';

const chapterId = z
  .string()
  .regex(/-chapter-(?<chapnum>\d+(\.\d+)?)$/)
  .transform(
    (v) =>
      v.match(/-chapter-(?<chapnum>\d+(\.\d+)?)$/)?.groups?.chapnum as string,
  );
const chapterRank = chapterId.transform((v) => Number(v));

export const sourceRizzfables: ISource<'rizzfables'> = {
  id: 'rizzfables',
  name: 'Realm oasis',
  url: 'https://realmoasis.com',
  formatChapterUrl: ({ sourceBookKey, chapterId }) =>
    `${sourceRizzfables.url}/chapter/${sourceBookKey}-chapter-${chapterId}`,

  entries: {
    fetchLatests: async (context) => {
      const session = await context.initFetcherSession({
        baseUrl: sourceRizzfables.url,
        ignorePrevSession: true,
      });
      const page = await session.go('/');
      const items = page.map({
        type: 'map',
        query: '.postbody .listupd > .utao > .uta',
        item: {
          url: {
            type: 'attr',
            name: 'href',
            query: '.imgu > a',
          },
          coverUrl: {
            query: '.imgu img',
            name: 'src',
            type: 'attr',
          },
          title: {
            type: 'text',
            query: '.luf h4',
          },
          chapters: {
            type: 'map',
            query: '.luf > ul > li',
            item: {
              url: {
                type: 'attr',
                query: 'a',
                name: 'href',
              },
              chapter: {
                type: 'text',
                query: 'a',
              },
              relativeTime: {
                type: 'attr',
                name: 'id',
                query: 'span[id]',
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
            url: z
              .string()
              .transform((url) => joinUrl(sourceRizzfables.url, url)),
            coverUrl: z
              .string()
              .transform((url) => joinUrl(sourceRizzfables.url, url)),
            title: z.string().trim(),
            id: z
              .string()
              .regex(/\/series\/(?<id>[^/]+)$/)
              .transform(
                (v) => v.match(/\/series\/(?<id>[^/]+)$/)?.groups?.id as string,
              )
              .transform((v) => v.split('-').slice(1).join('-')),
            key: z
              .string()
              .regex(/\/series\/(?<id>[^/]+)$/)
              .transform((v) => v.match(/\/series\/(?<id>[^/]+)$/)?.groups?.id),
            chapters: z
              .preprocess(
                (v) => {
                  const item = v as (typeof items)[number]['chapters'][number];
                  return {
                    url: item.url,
                    id: item.url,
                    rank: item.url,
                    publishedAt: item.relativeTime,
                  };
                },
                z.object({
                  url: z
                    .string()
                    .transform((url) => joinUrl(sourceRizzfables.url, url)),
                  id: chapterId,
                  rank: chapterRank,
                  publishedAt: z
                    .string()
                    .regex(/^relativeTime_(?<timestamp>\d+)$/)
                    .transform((v) => {
                      return new Date(
                        Number(
                          v.match(/^relativeTime_(?<timestamp>\d+)$/)?.groups
                            ?.timestamp,
                        ) * 1000,
                      );
                    }),
                }),
              )
              .array(),
          }),
        )
        .array()
        .parse(items);

      await context.books.upsert(
        parsedItems.map((item) => ({
          ...item,
          titleAccuracy: ACCURACY.LOW,
          chapters: item.chapters.map((chapt) => ({
            id: chapt.id,
            rank: chapt.rank,
            publishedAt: chapt.publishedAt,
            publishedAccuracy: ACCURACY.HIGH,
          })),
        })),
      );
    },
    book: {
      details: async ({ sourceBookId }, context) => {
        const sourceBook = await SourceRepo.books.get.byId(
          sourceRizzfables.id,
          sourceBookId,
        );
        if (!sourceBook) {
          context.logger.info(
            `[source-book-details] source book not found: ${sourceBookId}`,
          );
          return;
        }

        const session = await context.initFetcherSession();
        const page = await session.go(`/series/${sourceBook?.source_book_key}`);
        const res = page.map({
          type: 'object',
          fields: {
            title: {
              type: 'text',
              query: '.main-info h1.entry-title',
            },
            description: {
              type: 'text',
              query: '.info-desc div[id="description-container"]',
            },
            coverUrl: {
              type: 'attr',
              name: 'src',
              query: '.main-info .thumb > img',
            },
            chapters: {
              type: 'map',
              query: 'div[id="chapterlist"] > ul > li',
              item: {
                url: {
                  type: 'attr',
                  query: 'a',
                  name: 'href',
                },
                publishedAt: {
                  type: 'text',
                  query: 'span.chapterdate',
                },
              },
            },
          },
        });

        const parsedRes = z
          .object({
            title: z.string().trim(),
            description: z.string().trim(),
            coverUrl: z
              .string()
              .transform((v) => joinUrl(sourceRizzfables.url, v)),
            chapters: z
              .preprocess(
                (v) => {
                  const chapter = v as (typeof res)['chapters'][number];
                  return {
                    ...chapter,
                    id: chapter.url,
                    rank: chapter.url,
                  };
                },
                z.object({
                  url: z
                    .string()
                    .transform((v) => joinUrl(sourceRizzfables.url, v)),
                  id: chapterId,
                  rank: chapterRank,
                  publishedAt: z
                    .string()
                    .trim()
                    .transform((v) => parseFullFormattedDate(v)),
                }),
              )
              .array(),
          })
          .parse(res);

        await context.books.upsert([
          {
            id: sourceBookId,
            title: parsedRes.title,
            titleAccuracy: ACCURACY.HIGH,
            description: parsedRes.description,
            descriptionAccuracy: ACCURACY.HIGH,
            coverUrl: parsedRes.coverUrl,
            chapters: parsedRes.chapters.map((c) => ({
              id: c.id,
              rank: c.rank,
              publishedAt: c.publishedAt,
              publishedAccuracy: ACCURACY.MEDIUM,
            })),
          },
        ]);
      },
      fetchChapter: async ({ sourceBookId, chapterId }, context) => {
        const sourceBook = await SourceRepo.books.get.byId(
          sourceRizzfables.id,
          sourceBookId,
        );
        if (!sourceBook) {
          context.logger.info(
            `[source-book-chapter] source book not found: ${sourceBookId}`,
          );
          return;
        }

        const session = await context.initFetcherSession();
        const page = await session.go(
          sourceRizzfables.formatChapterUrl({
            sourceBookKey: sourceBook.source_book_key!,
            chapterId,
          }),
        );
        const res = page.map({
          type: 'object',
          fields: {
            pages: {
              type: 'map',
              query: 'div[id="readerarea"] img',
              item: {
                url: {
                  type: 'attr',
                  name: 'src',
                },
              },
            },
          },
        });

        const parsedRes = z
          .object({
            pages: z
              .object({
                url: z.string(),
              })
              .array(),
          })
          .parse(res);

        await fetchPictures([
          {
            type: 'chapter_pages',
            source_id: sourceRizzfables.id,
            source_book_id: sourceBookId,
            source_chapter_id: chapterId,
            pages: parsedRes.pages,
          },
        ]);
      },
    },
  },
};
