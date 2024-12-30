import { config } from 'config';
import { logger } from 'config/logger';
import { AuthRepo } from 'data/repo/auth-repo';
import { createMiddleware } from 'router/proute.utils';
import { literal, object, optional, union } from 'valibot';

export const authenticated = createMiddleware(
  {
    security: ['SessionCookie'],
    responses: {
      401: object({
        error: optional(
          union([
            literal('UNAUTHENTICATED'),
            literal('INVALID_SESSION'),
            literal('EXPIRED_SESSION'),
          ]),
        ),
      }),
      500: null,
    },
  },
  async function authenticatedMdw({ req }) {
    const authCookie = req.cookies[config.get('auth.session.cookie.name')] as
      | string
      | undefined;

    if (!authCookie) {
      return {
        status: 401,
        data: {
          error: 'UNAUTHENTICATED' as const,
        },
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
        status: 500,
      };
    }

    return {
      extraParam: {
        user,
        session,
      },
    };
  },
);
