import { config } from 'config';
import { prouteConfig } from 'proute';

export default prouteConfig({
  securitySchemes: {
    SessionCookie: {
      type: 'apiKey',
      in: 'cookie',
      name: config.get('auth.session.cookie.name'),
    },
  } as const,
});
