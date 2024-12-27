import { endpointConf, EndpointHandler } from 'proute';
import { object } from 'valibot';

import { ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.delete['/auth'],
  responses: {
    200: object({}),
  },
});

const handler: EndpointHandler<typeof conf> = async ({}): ReturnType<
  EndpointHandler<typeof conf>
> => {
  return {
    status: 200,
    data: {},
  };
};

export default { conf, handler };
