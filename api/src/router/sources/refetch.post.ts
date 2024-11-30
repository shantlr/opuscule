import { logger } from 'config/logger';
import { endpointConf, EndpointHandler } from 'proute';
import { fetchSourceLatests, Sources } from 'sources';
import { object, array, string, literal, union } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.post['/sources/refetch'],
  description: 'Refetch sources',
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

    for (const sourceId of source_ids) {
      const source = Sources.find((s) => s.id === sourceId);
      await fetchSourceLatests(source!);
    }

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
