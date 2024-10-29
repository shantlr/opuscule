import { keyBy } from 'lodash';
import { sourceAsuraScan } from './asurascan.js';
import { ISource } from './types.js';
import { createContext } from 'lib/cron-jobs/core/create-context';
import { sourceRizzfables } from './rizzfables.js';
import { sourceFlamescans } from './flamescans.js';

export const Sources = [
  sourceAsuraScan,
  sourceRizzfables,
  sourceFlamescans,
] satisfies ISource[];

export const SourcesByID = keyBy(Sources, (s) => s.id);

export const fetchSourceLatests = async (source: ISource) => {
  const context = createContext({ sourceId: source.id });

  await source.entries.fetchLatests(context);
};

export const fetchBookDetails = async (
  source: ISource,
  sourceBookId: string,
) => {
  const context = createContext({ sourceId: source.id });

  await source.entries.book.details({ sourceBookId }, context);
};

export const fetchBookChapter = async (
  source: ISource,
  sourceBookId: string,
  chapterId: string,
) => {
  const context = createContext({ sourceId: source.id });

  await source.entries.book.fetchChapter({ sourceBookId, chapterId }, context);
};
