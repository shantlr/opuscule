import { SourceRepo } from 'data/repo/source';
import { SourcesByID } from 'sources';
import { createContext } from './core/create-context';
import { formatDuration } from 'lib/utils/format-duration';

const sourceStates: Record<
  string,
  {
    minRetryAt: Date;
    retryCount: number;
  }
> = {};

export const fetchLatests = async (opt?: { force: boolean }) => {
  const sources = await SourceRepo.get.sourceToFetchLatests({
    force: opt?.force,
  });
  console.log(`[fetch-latests] starting, sources=${sources.length}`);

  for (const { id } of sources) {
    const source = SourcesByID[id];
    if (!source) {
      console.warn(`[fetch-latests] Source '${id}' not found`);
      continue;
    }

    const minDate = sourceStates[id]?.minRetryAt;

    if (minDate && Date.now() < minDate.valueOf()) {
      console.log(
        `[fetch-latests] source '${id}' - skipped (next_retry_at=${minDate.toISOString()})`,
      );
      continue;
    }

    try {
      console.log(`[fetch-latests] source '${id}' - started`);
      const start = Date.now();
      const context = createContext({ sourceId: id });
      await source.entries.fetchLatests(context);
      const end = Date.now();
      console.log(
        `[fetch-latests] source '${id}' - done (duration=${formatDuration(end - start)})`,
      );
      delete sourceStates[id];
      await SourceRepo.updates.fetchLatests.done(id);
    } catch (err) {
      //
      const retryCount = sourceStates[id]?.retryCount ?? 0;
      const nextRetryAt = new Date(
        Date.now() + 2 * (retryCount + 1) * 30 * 60 * 1000,
      );
      console.log(
        `[fetch-latests] source '${id}' failed (next_retry_at: ${nextRetryAt.toISOString()}):`,
        err,
      );
      sourceStates[id] = {
        minRetryAt: nextRetryAt,
        retryCount: retryCount + 1,
      };
    }
  }
  console.log(`[fetch-latests] done`);
};
