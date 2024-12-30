import { BookRepo } from 'data/repo/books-repo';
import { HtmlCacheRepo } from 'data/repo/html-cache';
import { SourceBookRepo } from 'data/repo/source-book-repo';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { Sources } from 'sources';
import { object, string, nullish, picklist } from 'valibot';

import { ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.get['/chapters/:id/source/raw'], {
  responses: {
    200: object({
      content: nullish(string()),
    }),
    400: object({
      error: picklist(['UNKNOWN_SOURCE', 'UNKNOWN_SOURCE_BOOK']),
    }),
    404: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
}): ReturnType<EndpointHandler<typeof conf>> => {
  const chapter = await BookRepo.chapters.get.byId(id);
  if (!chapter) {
    return {
      status: 404,
      data: undefined,
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

  return {
    status: 200,
    data: {
      content: html?.data,
    },
  };
};

export default { conf, handler };
