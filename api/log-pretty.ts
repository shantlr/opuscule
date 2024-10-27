import { runPinoGrove } from 'pino-grove';
import { expressConfig } from 'pino-grove/express';

runPinoGrove({
  configs: [
    expressConfig,
    {
      prefix: {
        append: ['scope'],
        formatters: {
          scope: (logObj, { pc }) => {
            if (typeof logObj.scope === 'string') {
              return pc.yellow(`[${logObj.scope}]`);
            }
          },
        },
      },
      ignoreFormatFields: {
        scope: true,
      },
    },
  ],
});
