import { logger } from 'config/logger';
import { SourceRepo } from 'data/repo/source';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { ROUTES } from 'router/proute.generated.routes';
import { fetchSourceLatests, Sources } from 'sources';
import { boolean, object, picklist } from 'valibot';

const conf = endpointConf(ROUTES.post['/sources/:id/subscribe'], {
  responses: {
    200: object({
      success: boolean(),
    }),
    400: object({
      success: boolean(),
      error: picklist(['UNKNOWN_SOURCE']),
    }),
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
  user,
}) => {
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

    await SourceRepo.updates.subscribe({
      sourceId: id,
      userId: user.id,
    });
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
