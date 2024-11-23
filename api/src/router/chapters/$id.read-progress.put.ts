import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { endpointConf, EndpointHandler } from 'proute';
import { object, number } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.put['/chapters/:id/read-progress'],
  body: object({
    percentage: number(),
    page: number(),
  }),
  responses: {
    200: object({}),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
  body: { percentage, page },
}) => {
  try {
    await BookRepo.chapters.updates.readProgress({
      chapterId: id,
      percentage,
      page,
    });
    return {
      status: 200,
      data: {},
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
