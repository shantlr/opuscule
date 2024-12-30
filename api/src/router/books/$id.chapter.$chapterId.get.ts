import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { fetchChapter } from 'lib/cron-jobs/fetch-chapter';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { RESOURCES, ROUTES } from 'router/proute.generated.routes';
import { object } from 'valibot';

const conf = endpointConf(ROUTES.get['/books/:id/chapter/:chapterId'], {
  responses: {
    200: object({
      chapter: RESOURCES.chapter,
    }),
    404: null,
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { chapterId },
}) => {
  try {
    const chapter = await BookRepo.chapters.get.byIdWithReadProgress(chapterId);

    if (!chapter) {
      return {
        status: 404,
        data: null,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (chapter && !(chapter.pages as any[])?.length) {
      await fetchChapter({
        chapterId: chapter.id,
        force: true,
      });
      const updated = await BookRepo.chapters.get.byIdWithReadProgress(
        chapter.id,
      );
      if (!updated) {
        return {
          status: 404,
          data: null,
        };
      }

      return {
        status: 200,
        data: {
          chapter: updated,
        },
      };
    }

    return {
      status: 200,
      data: {
        chapter,
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
