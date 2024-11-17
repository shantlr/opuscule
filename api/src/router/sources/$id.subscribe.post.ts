import { logger } from 'config/logger';
import { SourceRepo } from 'data/repo/source';
import { endpointConf, EndpointHandler } from 'proute';
import { ROUTES } from 'router/base-conf';
import { fetchSourceLatests, Sources } from 'sources';
import { boolean, object, union, literal } from 'valibot';

const conf = endpointConf({
  route: ROUTES.post['/sources/:id/subscribe'],
  responses: {
    200: object({
      success: boolean(),
    }),
    400: object({
      success: boolean(),
      error: union([literal('UNKNOWN_SOURCE')]),
    }),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({ params: { id } }) => {
  try {
    const source = Sources.find((s) => s.id === id);
    if (!source) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'UNKNOWN_SOURCE',
        },
      };
    }

    await SourceRepo.updates.subscribe(id);
    logger.info(`[fetch-source-latests] ${source.id} started (from=subscribe)`);
    void fetchSourceLatests(source!).catch((err) => {
      logger.error(
        `[fetch-source-latests] ${source!.id} failed (from=subscribe)`,
        err,
      );
    });

    return {
      status: 200,
      data: {
        success: true,
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
