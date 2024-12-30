import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { object, string } from 'valibot';

import { ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.get['/auth/me'], {
  responses: {
    200: object({
      user: object({
        id: string(),
      }),
    }),
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  user,
}): ReturnType<EndpointHandler<typeof conf>> => {
  return {
    status: 200,
    data: {
      user: {
        id: user.id,
      },
    },
  };
};

export default { conf, handler };
