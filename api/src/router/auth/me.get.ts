import { config } from 'config';
import { logger } from 'config/logger';
import { AuthRepo } from 'data/repo/auth-repo';
import { endpointConf, EndpointHandler } from 'proute';
import { object, union, literal, optional, string } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.get['/auth/me'],
  responses: {
    200: object({
      user: object({
        id: string(),
      }),
    }),
    400: object({
      error: literal('INVALID_USER'),
    }),
    401: object({
      error: optional(
        union([literal('INVALID_SESSION'), literal('EXPIRED_SESSION')]),
      ),
    }),
  },
});

const handler: EndpointHandler<typeof conf> = async ({
  req,
}): ReturnType<EndpointHandler<typeof conf>> => {
  const authCookie = req.cookies[config.get('auth.session.cookie.name')] as
    | string
    | undefined;

  if (!authCookie) {
    return {
      status: 401,
      data: {},
    };
  }

  const { session, error } = await AuthRepo.sessions.resolve({
    token: authCookie,
  });
  if (error || !session) {
    logger.error({ scope: 'auth.me.get' }, 'invalid session', { error });
    return {
      status: 401,
      cookies: {
        [config.get('auth.session.cookie.name')]: null,
      },
      data: {},
    };
  }

  const user = await AuthRepo.user.get.byId(session.user_id);
  if (!user) {
    return {
      status: 400,
      data: {
        error: 'INVALID_USER',
      },
    };
  }

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
