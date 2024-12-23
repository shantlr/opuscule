import { keyBy } from 'lodash';
import { createContext } from 'sources/lib/create-context.js';

import { sourceAsuraScan } from './asurascan.js';
import { sourceFlamescans } from './flamescans.js';
import { sourceRizzfables } from './rizzfables.js';
import { ISource } from './types.js';

export const Sources: ISource[] = [
  sourceAsuraScan,
  sourceRizzfables,
  sourceFlamescans,
];

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
  opt?: {
    force?: boolean;
  },
) => {
  const context = createContext({
    sourceId: source.id,
    skipCache: opt?.force,
  });

  await source.entries.book.fetchChapter({ sourceBookId, chapterId }, context);
};
