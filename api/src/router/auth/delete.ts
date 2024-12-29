import { config } from 'config';
import { logger } from 'config/logger';
import { AuthRepo } from 'data/repo/auth-repo';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { object } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.delete['/auth'],
  responses: {
    200: object({}),
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  session,
}): ReturnType<EndpointHandler<typeof conf>> => {
  try {
    await AuthRepo.sessions.disable(session.id);
  } catch (err) {
    logger.error(err, 'failed to disable session');
  }

  return {
    status: 200,
    cookies: {
      [config.get('auth.session.cookie.name')]: null,
    },
    data: {},
  };
};

export default { conf, handler };
