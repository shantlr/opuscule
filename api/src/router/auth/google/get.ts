import { randomBytes } from 'crypto';

import { GOOGLE_AUTH } from 'lib/auth';
import { endpointConf, EndpointHandler, redirect } from 'proute';
import { object } from 'valibot';

import { ROUTES } from '../../base-conf';

import { googleOauthStateCache } from './state-cache';

const conf = endpointConf({
  route: ROUTES.get['/auth/google'],
  responses: {
    200: object({}),
    302: redirect(),
  },
});

const handler: EndpointHandler<typeof conf> = async ({}): ReturnType<
  EndpointHandler<typeof conf>
> => {
  const state = randomBytes(64).toString('base64');
  googleOauthStateCache.set(state, true);
  const url = GOOGLE_AUTH.startSSOUrl({
    state,
  });

  return {
    status: 302,
    data: {
      redirect_url: url,
    },
  };
};

export default { conf, handler };
