import { SourceRepo } from 'data/repo/source';
import { SourcesByID } from 'sources';
import { createContext } from './core/create-context';
import { formatDuration } from 'lib/utils/format-duration';

export const fetchLatests = async () => {
  const sources = await SourceRepo.get.sourceToFetchLatests();
  console.log(`[fetch-latests] starting, sources=${sources.length}`);

  for (const { id } of sources) {
    const source = SourcesByID[id];
    if (!source) {
      console.warn(`[fetch-latests] Source '${id}' not found`);
      continue;
    }

    console.log(`[fetch-latests] source '${id}' - started`);
    const start = Date.now();
    const context = createContext({ sourceId: id });
    await source.entries.fetchLatests(context);
    const end = Date.now();
    console.log(
      `[fetch-latests] source '${id}' - done (duration=${formatDuration(end - start)})`,
    );
    await SourceRepo.updates.fetchLatests.done(id);
  }
  console.log(`[fetch-latests] done`);
};
