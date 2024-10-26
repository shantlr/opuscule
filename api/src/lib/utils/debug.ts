import { logger } from 'config/logger';
import { Request } from 'got';

export const describeRequest = (request: Request) => {
  logger.info('debug::request', {
    url: request.requestUrl,
    method: request.options.method,
    headers: request.options.headers,

    response: {
      code: request.response?.statusCode,
      message: request.response?.statusMessage,
      headers: request.response?.headers,
    },
  });
};
