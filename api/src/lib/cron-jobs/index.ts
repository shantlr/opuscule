import { fetchLatests } from './fetch-latests';
import { GlobalSettingsRepo } from 'data/repo/global-settings';

type CronJob = {
  start(): void;
  stop(): void;
};

const createCronJob = ({
  log,
  handler,
  doImmediately,
  interval,
  autoStart = false,
}: {
  log: {
    prefix: string;
    name: string;
  };
  doImmediately: boolean;
  handler: () => Promise<void> | void;
  interval: number;
  autoStart?: boolean;
}): CronJob => {
  let handle: NodeJS.Timeout | null;

  const job: CronJob = {
    start() {
      if (!handle) {
        console.log(`${log.prefix} '${log.name}' - setup`);
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

export const setupCronJobs = async () => {
  const settings = await GlobalSettingsRepo.get();

  if (!settings) {
    throw new Error(`Global settings not found`);
  }

  const state: {
    fetchLatests?: CronJob | null;
  } = {};

  if ((settings.fetch_latests_interval_ms ?? 0) > 0) {
    state.fetchLatests = createCronJob({
      log: {
        prefix: `[cron]`,
        name: `fetch-latests`,
      },
      handler: fetchLatests,
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
