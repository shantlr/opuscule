import { config } from 'config';
import { AuthRepo } from 'data/repo/auth-repo';
import { jwtDecode } from 'jwt-decode';
import { GOOGLE_AUTH } from 'lib/auth';
import { endpointConf, EndpointHandler, redirect } from 'proute';
import { object, string, union, literal, optional } from 'valibot';

import { ROUTES } from '../../proute.generated.routes';

import { googleOauthStateCache } from './state-cache';

const conf = endpointConf(ROUTES.get['/auth/google/callback'], {
  query: object({
    state: string(),
    code: string(),
    scope: string(),
  }),
  responses: {
    302: redirect({
      query: object({
        error: optional(
          union([
            literal('MISSING_STATE'),
            literal('MISSING_CODE'),
            literal('MISSING_ID_TOKEN'),
            literal('INVALID_ID_TOKEN'),
            literal('INVALID_STATE'),
          ]),
        ),
      }),
    }),
  },
});

const FAILURE_REDIRECT_URL = `${config.get('app.url')}/sign-in`;

const handler: EndpointHandler<typeof conf> = async ({
  query,
}): ReturnType<EndpointHandler<typeof conf>> => {
  if (!query.state) {
    return {
      status: 302,
      data: {
        redirect_url: FAILURE_REDIRECT_URL,
        redirect_url_query: {
          error: 'MISSING_STATE',
        },
      },
    };
  }
  if (!query.code) {
    return {
      status: 302,
      data: {
        redirect_url: FAILURE_REDIRECT_URL,
        redirect_url_query: {
          error: 'MISSING_CODE',
        },
      },
    };
  }

  if (!googleOauthStateCache.has(query.state)) {
    return {
      status: 302,
      data: {
        redirect_url: FAILURE_REDIRECT_URL,
        redirect_url_query: {
          error: 'MISSING_CODE',
        },
      },
    };
  }

  googleOauthStateCache.del(query.state);

  const { idToken, refreshToken } = await GOOGLE_AUTH.exchangeCodeForTokens({
    code: query.code,
  });

  if (!idToken) {
    return {
      status: 302,
      data: {
        redirect_url: FAILURE_REDIRECT_URL,
        redirect_url_query: {
          error: 'MISSING_ID_TOKEN',
        },
      },
    };
  }

  const decoded = jwtDecode<{
    sub: string;
    at_hash: string;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
  }>(idToken);

  if (!decoded.sub) {
    return {
      status: 302,
      data: {
        redirect_url: FAILURE_REDIRECT_URL,
        redirect_url_query: {
          error: 'INVALID_ID_TOKEN',
        },
      },
    };
  }

  const user = await AuthRepo.user.upsert({
    firstName: decoded.given_name,
    lastName: decoded.family_name,
    google: {
      sub: decoded.sub,
      refreshToken: refreshToken ?? undefined,
    },
  });

  const session = await AuthRepo.sessions.create({
    origin: 'google',
    userId: user.id,
  });

  return {
    status: 302,
    cookies: {
      [config.get('auth.session.cookie.name')]: {
        value: session.token,
        httpOnly: true,
        domain: config.get('auth.session.cookie.domain'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sameSite: config.get('auth.session.cookie.sameSite') as any,
        secure: config.get('auth.session.cookie.secure'),
      },
    },
    data: {
      redirect_url: FAILURE_REDIRECT_URL,
      redirect_url_query: {},
    },
  };
};

export default { conf, handler };
