import { SourceRepo } from 'data/repo/source';
import { endpointConf, EndpointHandler } from 'proute';
import { ROUTES } from 'router/base-conf';
import { boolean, object } from 'valibot';

const conf = endpointConf({
  route: ROUTES.delete['/sources/:id/subscribe'],
  responses: {
    200: object({
      success: boolean(),
    }),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({ params: { id } }) => {
  try {
    await SourceRepo.updates.unsubscribe(id);
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
