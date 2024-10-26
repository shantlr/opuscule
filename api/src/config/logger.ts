import { config } from 'config';
import pino from 'pino';

export const logger = pino({
  name: config.get('service.name'),
});

export const defaultLogger = logger;
