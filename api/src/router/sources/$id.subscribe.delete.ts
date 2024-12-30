import { SourceRepo } from 'data/repo/source';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { ROUTES } from 'router/proute.generated.routes';
import { boolean, object } from 'valibot';

const conf = endpointConf(ROUTES.delete['/sources/:id/subscribe'], {
  responses: {
    200: object({
      success: boolean(),
    }),
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
  user,
}) => {
  try {
    await SourceRepo.updates.unsubscribe({
      sourceId: id,
      userId: user.id,
    });
    return {
      status: 200,
      data: {
        success: true,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      data: null,
    };
  }
};

export default {
  conf,
  handler,
};
