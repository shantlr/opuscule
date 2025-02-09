import { SourceRepo } from 'data/repo/source';
import { formatPublicS3Url } from 'lib/s3';
import { authenticated } from 'middlewares';
import { EndpointHandler, endpointConf } from 'proute';
import { ROUTES } from 'router/proute.generated.routes';
import { Sources } from 'sources';
import { boolean, array, object, string } from 'valibot';

const conf = endpointConf(ROUTES.get['/sources'], {
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
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({ user }) => {
  const sources = await SourceRepo.get.listAll();
  const subscribedSources = await SourceRepo.get.listSubscribed(user.id);
  return {
    status: 200,
    data: Sources.map((s) => {
      const source = sources.find((ss) => ss.id === s.id);
      return {
        id: s.id,
        name: s.name,
        url: s.url,
        logo_url:
          source?.icon_s3_key && source?.icon_s3_bucket
            ? formatPublicS3Url(source.icon_s3_bucket, source.icon_s3_key)
            : null,
        subscribed: subscribedSources.some((ss) => ss.id === s.id),
      };
    }),
  };
};

export default {
  conf,
  handler,
};
