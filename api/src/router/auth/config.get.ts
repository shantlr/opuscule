import { config } from 'config';
import { endpointConf, EndpointHandler } from 'proute';
import { object, nullable } from 'valibot';

import { ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.get['/auth/config'], {
  responses: {
    200: object({
      google: nullable(object({})),
    }),
  },
});

const handler: EndpointHandler<typeof conf> = async ({}): ReturnType<
  EndpointHandler<typeof conf>
> => {
  return {
    status: 200,
    data: {
      google: config.get('google.oauth.clientId') ? {} : null,
    },
  };
};

export default { conf, handler };
