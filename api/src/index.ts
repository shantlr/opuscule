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

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const main = async () => {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../drizzle'),
  });
  logger.info(`[startup] db migrated`);

  await checkGlobalSettings();
  await setupCronJobs();

  const app = express();

  app.use(
    cors({
      origin: config.get('api.cors.origin'),
    }),
    bodyParser.json(),
  );
  app.use(router);

  app.listen(config.get('service.port'), () => {
    logger.info(
      `[startup] api started on http://localhost:${config.get('service.port')}`,
    );
  });
};

main().catch((err) => {
  logger.error(err, `main failed`);
  process.exit(1);
});
