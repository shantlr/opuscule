import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { object, number } from 'valibot';

import { RESOURCES, ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.put['/chapters/:id/read-progress'], {
  body: object({
    percentage: number(),
    page: number(),
  }),
  responses: {
    200: object({
      chapter: RESOURCES.chapter,
    }),
    404: null,
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
  body: { percentage, page },
  user,
}) => {
  try {
    await BookRepo.chapters.updates.readProgress({
      chapterId: id,
      percentage,
      page,
      userId: user.id,
    });
    const chapter = await BookRepo.chapters.get.byIdWithReadProgress(id);

    if (!chapter) {
      return {
        status: 404,
        data: null,
      };
    }

    return {
      status: 200,
      data: {
        chapter: chapter,
      },
    };
  } catch (err) {
    logger.error(err);
    return {
      status: 500,
      data: null,
    };
  }
};

export default { conf, handler };
