import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { fetchChapter } from 'lib/cron-jobs/fetch-chapter';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { RESOURCES, ROUTES } from 'router/proute.generated.routes';
import { nullable, object, string } from 'valibot';

const conf = endpointConf(ROUTES.get['/books/:id/chapter/:chapterId'], {
  responses: {
    200: object({
      chapter: RESOURCES.chapter,
      next_chapter_id: nullable(string()),
      previous_chapter_id: nullable(string()),
    }),
    404: null,
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { chapterId },
}) => {
  try {
    let chapter = await BookRepo.chapters.get.byIdWithReadProgress(chapterId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (chapter && !(chapter.pages as any[])?.length) {
      // fetch chapter when pages are not available
      await fetchChapter({
        chapterId: chapter.id,
        force: true,
      });
      chapter = await BookRepo.chapters.get.byIdWithReadProgress(chapter.id);
    }

    if (!chapter) {
      return {
        status: 404,
        data: null,
      };
    }

    const [next, prev] = await Promise.all([
      BookRepo.chapters.get.nextByRank({
        bookId: chapter.source_book_id,
        rank: chapter.chapter_rank,
      }),
      BookRepo.chapters.get.prevByRank({
        bookId: chapter.source_book_id,
        rank: chapter.chapter_rank,
      }),
    ]);

    return {
      status: 200,
      data: {
        chapter,
        next_chapter_id: next?.id ?? null,
        previous_chapter_id: prev?.id ?? null,
      },
    };
  } catch (err) {
    logger.error(err);
    return {
      status: 500,
    };
  }
};

export default {
  conf,
  handler,
};
