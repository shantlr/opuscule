import { config } from 'config';
import { endpointConf, EndpointHandler } from 'proute';
import { object, nullable, string } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.get['/auth/config'],
  responses: {
    200: object({
      google: nullable(
        object({
          client_id: string(),
          redirect_url: string(),
        }),
      ),
    }),
  },
});

const handler: EndpointHandler<typeof conf> = async (): ReturnType<
  EndpointHandler<typeof conf>
> => {
  const googleClientId = config.get('google.oauth.clientId');
  return {
    status: 200,
    data: {
      google: googleClientId
        ? {
            client_id: googleClientId,
            redirect_url: config.get('google.oauth.redirectUrl'),
          }
        : null,
    },
  };
};

export default { conf, handler };
