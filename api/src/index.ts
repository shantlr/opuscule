import crypto from 'crypto';
import { mkdir } from 'fs/promises';
import path from 'path';

import bodyParser from 'body-parser';
import { config } from 'config';
import { logger } from 'config/logger';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import express from 'express';
import { addLogger } from 'pino-grove/express';

import { db } from './data/db';
import { setupCronJobs } from './lib/cron-jobs';
import { checkGlobalSettings } from './lib/global-settings';
import { router } from './router';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const main = async () => {
  const log = logger.scope('startup');

  if (!config.get('chapter.page.s3KeyRand.seed')) {
    log.warn(`missing CHAPTER_PAGE_S3_KEY_RAND_SEED env var`);
    const example = crypto.randomBytes(16).toString('base64');
    log.info(`Here an random one: CHAPTER_PAGE_S3_KEY_RAND_SEED=${example}`);
    process.exit(1);
  }

  if (!config.get('google.oauth.encrypt.refresh.token.secret')) {
    log.warn(`missing GOOGLE_OAUTH_ENCRYPT_REFRESH_TOKEN_SECRET env var`);
    const example = crypto.randomBytes(32).toString('hex');
    log.info(
      `Here an random one: GOOGLE_OAUTH_ENCRYPT_REFRESH_TOKEN_SECRET=${example}`,
    );
    process.exit(1);
  }

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
      credentials: true,
    }),
    bodyParser.json(),
    cookieParser(),
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
