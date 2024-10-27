import { fetchLatests } from './fetch-latests';
import { GlobalSettingsRepo } from 'data/repo/global-settings';
import { defaultLogger, Logger } from 'config/logger';

type CronJob = {
  start(): void;
  stop(): void;
};

const createCronJob = ({
  logger = defaultLogger,
  handler,
  doImmediately,
  interval,
  autoStart = false,
}: {
  doImmediately: boolean;
  handler: () => Promise<void> | void;
  interval: number;
  autoStart?: boolean;
  logger?: Logger;
}): CronJob => {
  let handle: NodeJS.Timeout | null;

  const job: CronJob = {
    start() {
      if (!handle) {
        logger.info(`setup`);
        handle = setInterval(() => {
          handler();
        }, interval);
        if (doImmediately) {
          handler();
        }
      }
    },
    stop: () => {
      if (handle) {
        clearInterval(handle);
        handle = null;
      }
    },
  };

  if (autoStart) {
    job.start();
  }

  return job;
};

export const setupCronJobs = async ({
  logger = defaultLogger,
}: {
  logger?: Logger;
} = {}) => {
  const settings = await GlobalSettingsRepo.get();

  if (!settings) {
    throw new Error(`Global settings not found`);
  }

  const state: {
    fetchLatests?: CronJob | null;
  } = {};

  if ((settings.fetch_latests_interval_ms ?? 0) > 0) {
    state.fetchLatests = createCronJob({
      logger: logger.scope('cron.fetch-latests'),
      handler: () => fetchLatests({ logger: logger.scope('cron') }),
      doImmediately: true,
      interval: settings.fetch_latests_interval_ms!,
      autoStart: true,
    });
  }

  return () => {
    if (state.fetchLatests) {
      state.fetchLatests.stop();
    }
  };
};
