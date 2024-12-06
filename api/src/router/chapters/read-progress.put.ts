import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { endpointConf, EndpointHandler } from 'proute';
import { object, array, string, boolean } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.put['/chapters/read-progress'],
  body: object({
    chapters: array(
      object({
        id: string(),
        read: boolean(),
      }),
    ),
  }),
  responses: {
    200: object({}),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({
  body: { chapters },
}): ReturnType<EndpointHandler<typeof conf>> => {
  try {
    await BookRepo.chapters.updates.readProgressMany(chapters);
    return {
      status: 200,
      data: {},
    };
  } catch (err) {
    logger.warn(err);
    return {
      status: 500,
      data: undefined,
    };
  }
};

export default { conf, handler };
