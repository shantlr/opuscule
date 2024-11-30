import { logger } from 'config/logger';
import { SourceRepo } from 'data/repo/source';
import { endpointConf, EndpointHandler } from 'proute';
import { Sources } from 'sources';
import { object, array, string, literal, union } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.post['/sources/subscribe'],
  description: 'Subscribe to multiple sources',
  body: object({
    source_ids: array(string()),
  }),
  responses: {
    200: object({}),
    400: object({
      success: literal(false),
      error: union([literal('UNKNOWN_SOURCE')]),
    }),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({
  body: { source_ids },
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

    await SourceRepo.updates.subscribeMany(source_ids);

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
