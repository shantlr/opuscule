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

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const main = async () => {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../drizzle'),
  });
  console.log('DB migrated');

  await checkGlobalSettings();
  await setupCronJobs();

  // await fetchLatests({ force: true });

  const app = express();

  app.use(
    cors({
      origin: config.get('api.cors.origin'),
    }),
    bodyParser.json(),
  );
  app.use(router);

  app.listen(config.get('service.port'), () => {
    console.log(
      `Api started on http://localhost:${config.get('service.port')}`,
    );
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
