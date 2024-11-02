import express from 'express';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './data/db';
import path from 'path';
import cors from 'cors';
import { checkGlobalSettings } from './lib/global-settings';
import { setupCronJobs } from './lib/cron-jobs';
import { router } from 'router';
import { config } from 'config';
import bodyParser from 'body-parser';
import { logger } from 'config/logger';
import { addLogger } from 'pino-grove/express';
import { mkdir } from 'fs/promises';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const main = async () => {
  const log = logger.scope('startup');

  await mkdir(path.parse(config.get('db.path')).dir, {
    recursive: true,
  });
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../drizzle'),
  });
  log.info(`db migrated`);

  await checkGlobalSettings();
  await setupCronJobs();

  const app = express();

  app.use(
    cors({
      origin: config.get('api.cors.origin'),
    }),
    bodyParser.json(),
    addLogger(logger),
  );
  app.use(router);

  app.listen(config.get('service.port'), () => {
    log.info(`api started on http://localhost:${config.get('service.port')}`);
  });
};

main().catch((err) => {
  logger.error(err, `main failed`);
  process.exit(1);
});
