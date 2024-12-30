import { keyBy } from 'lodash';
import { createContext } from 'sources/lib/create-context/index.js';

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

  try {
    await source.entries.fetchLatests(context);
  } finally {
    await context.close();
  }
};

export const fetchBookDetails = async (
  source: ISource,
  sourceBookId: string,
) => {
  const context = createContext({ sourceId: source.id });

  try {
    await source.entries.book.details({ sourceBookId }, context);
  } finally {
    await context.close();
  }
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

  try {
    await source.entries.book.fetchChapter(
      { sourceBookId, chapterId },
      context,
    );
  } finally {
    await context.close();
  }
};
