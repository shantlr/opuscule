import { defaultLogger, Logger } from 'config/logger';
import { SourceRepo } from 'data/repo/source';
import { formatDuration } from 'lib/utils/format-duration';
import { SourcesByID } from 'sources';

import { createContext } from '../../sources/lib/create-context';

const sourceStates: Record<
  string,
  {
    minRetryAt: Date;
    retryCount: number;
  }
> = {};

export const fetchLatests = async ({
  logger = defaultLogger,
  ...opt
}: {
  force?: boolean;
  logger?: Logger;
} = {}) => {
  const log = logger.scope('fetch-latests');
  const sources = await SourceRepo.get.sourceToFetchLatests({
    force: opt?.force,
  });
  log.info(
    `starting, sources=${sources?.length ? sources.map((s) => s.id).join(',') : '<none>'}`,
  );

  for (const { id } of sources) {
    const source = SourcesByID[id];
    if (!source) {
      log.warn(`source '${id}' not found`);
      continue;
    }

    const minDate = sourceStates[id]?.minRetryAt;

    if (minDate && Date.now() < minDate.valueOf()) {
      log.info(
        `source '${id}' - skipped (next_retry_at=${minDate.toISOString()})`,
      );
      continue;
    }

    try {
      log.info(`source '${id}' - started`);
      const start = Date.now();
      const context = createContext({ sourceId: id });
      await source.entries.fetchLatests(context);
      const end = Date.now();
      log.info(
        `source '${id}' - done (duration=${formatDuration(end - start)})`,
      );
      delete sourceStates[id];
      await SourceRepo.updates.fetchLatests.done(id);
    } catch (err) {
      const retryCount = sourceStates[id]?.retryCount ?? 0;
      const nextRetryAt = new Date(
        Date.now() + 2 * (retryCount + 1) * 30 * 60 * 1000,
      );
      log.info(
        `source '${id}' failed (next_retry_at: ${nextRetryAt.toISOString()}):`,
        err,
      );
      sourceStates[id] = {
        minRetryAt: nextRetryAt,
        retryCount: retryCount + 1,
      };
    }
  }
  log.info(`done`);
};
