import { BookRepo } from 'data/repo/books-repo';
import { HtmlCacheRepo } from 'data/repo/html-cache';
import { SourceBookRepo } from 'data/repo/source-book-repo';
import { endpointConf, EndpointHandler } from 'proute';
import { Sources } from 'sources';
import { object, union, literal, string, nullable } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.get['/chapters/:id/source/raw'],
  responses: {
    200: object({
      content: nullable(string()),
    }),
    400: object({
      error: union([literal('UNKNOWN_SOURCE'), literal('UNKNOWN_SOURCE_BOOK')]),
    }),
    404: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({ params: { id } }) => {
  const chapter = await BookRepo.chapters.get.byId(id);
  if (!chapter) {
    return {
      status: 404,
    };
  }

  const source = Sources.find((s) => s.id === chapter.source_id);
  if (!source) {
    return {
      status: 400,
      data: {
        error: 'UNKNOWN_SOURCE',
      },
    };
  }
  const sourceBook = await SourceBookRepo.get.byId(chapter.source_book_id);
  if (!sourceBook?.source_book_key) {
    return {
      status: 400,
      data: {
        error: 'UNKNOWN_SOURCE_BOOK',
      },
    };
  }

  const html = await HtmlCacheRepo.get.lastByKey(
    `${source.id}:${source.formatChapterUrl({
      sourceBookKey: sourceBook.source_book_key!,
      chapterId: chapter.chapter_id,
    })}`,
  );

  console.log('HTML', html);

  return {
    status: 200,
    data: {
      content: html?.data,
    },
  };
};

export default { conf, handler };
