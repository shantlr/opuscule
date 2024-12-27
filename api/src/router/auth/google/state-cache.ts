import { config } from 'config';
import NodeCache from 'node-cache';

export const googleOauthStateCache = new NodeCache({
  maxKeys: config.get('google.oauth.state.limit'),
  stdTTL: config.get('google.oauth.state.ttlSeconds'),
});
