import { keyBy } from 'lodash';
import { sourceAsuraScan } from './asurascan.js';
import { ISource } from './types.js';
import { createContext } from 'lib/cron-jobs/core/create-context';

export const Sources = [sourceAsuraScan] satisfies ISource[];

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
