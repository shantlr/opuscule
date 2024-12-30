import { randomBytes } from 'crypto';

import { GOOGLE_AUTH } from 'lib/auth';
import { endpointConf, EndpointHandler, redirect } from 'proute';

import { ROUTES } from '../../proute.generated.routes';

import { googleOauthStateCache } from './state-cache';

const conf = endpointConf(ROUTES.get['/auth/google'], {
  responses: {
    302: redirect({}),
  },
});

const handler: EndpointHandler<typeof conf> = async (): ReturnType<
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
