import { config } from 'config';
import pino from 'pino';

export type Logger = pino.Logger & {
  scope: (name: string) => Logger;
};

const wrapLogger = (
  logger: pino.Logger,
  options?: { scope?: string },
): Logger => {
  const l = logger as Logger;
  l.scope = (name: string) => {
    const nextScope = options?.scope ? `${options.scope}.${name}` : name;

    return wrapLogger(logger.child({ scope: nextScope }), {
      ...options,
      scope: nextScope,
    });
  };
  return l;
};

export const logger = wrapLogger(
  pino({
    name: config.get('service.name'),
  }),
);
export const defaultLogger = logger;
