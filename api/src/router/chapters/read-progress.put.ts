import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { object, array, string, boolean } from 'valibot';

import { ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.put['/chapters/read-progress'], {
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
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  body: { chapters },
  user,
}): ReturnType<EndpointHandler<typeof conf>> => {
  try {
    await BookRepo.chapters.updates.readProgressMany(
      chapters.map((chapter) => ({
        ...chapter,
        userId: user.id,
      })),
    );
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
