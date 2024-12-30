import { logger } from 'config/logger';
import { SourceRepo } from 'data/repo/source';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { Sources } from 'sources';
import { object, array, string, literal, union, picklist } from 'valibot';

import { ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.post['/sources/subscribe'], {
  description: 'Subscribe to multiple sources',
  body: object({
    source_ids: array(string()),
  }),
  responses: {
    200: object({}),
    400: object({
      success: literal(false),
      error: picklist(['UNKNOWN_SOURCE']),
    }),
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  body: { source_ids },
  user,
}): ReturnType<EndpointHandler<typeof conf>> => {
  try {
    if (source_ids.some((id) => !Sources.find((s) => s.id === id))) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'UNKNOWN_SOURCE',
        },
      };
    }

    await SourceRepo.updates.subscribeMany({
      sourceIds: source_ids,
      userId: user.id,
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
