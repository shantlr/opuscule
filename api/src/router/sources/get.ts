import { SourceRepo } from 'data/repo/source';
import { EndpointHandler, endpointConf } from 'proute';
import { ROUTES } from 'router/base-conf';
import { Sources } from 'sources';
import { boolean, array, object, string } from 'valibot';

const conf = endpointConf({
  route: ROUTES.get['/sources'],
  responses: {
    200: array(
      object({
        id: string(),
        name: string(),
        url: string(),
        subscribed: boolean(),
      }),
    ),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async () => {
  const subscribedSources = await SourceRepo.get.listSubscribed();
  return {
    status: 200,
    data: Sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      subscribed: subscribedSources.some((ss) => ss.id === s.id),
    })),
  };
};

export default {
  conf,
  handler,
};
