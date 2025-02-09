import { defaultLogger, Logger } from 'config/logger.js';
import { SourceRepo } from 'data/repo/source.js';
import { joinUrl } from 'lib/utils/join-url.js';
import { keyBy } from 'lodash';
import { createContext } from 'sources/lib/create-context/index.js';

import { sourceAsuraScan } from './asurascan.js';
import { sourceFlamescans } from './flamescans.js';
import { fetchPictures } from './lib/fetch-pictures.js';
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

export const fetchSourceIcon = async (
  sourceId: string,
  {
    logger = defaultLogger,
  }: {
    logger?: Logger;
  } = {},
) => {
  const source = SourcesByID[sourceId];
  if (!source) {
    throw new Error(`source ${sourceId} not found`);
  }

  const context = createContext({ sourceId: source.id });
  const fetcher = await context.initFetcherSession({ baseUrl: source.url });
  try {
    const page = await fetcher.go('/');
    const iconUrl = page.map({
      type: 'attr',
      query: 'html > head > link[rel="icon"]',
      name: 'href',
    });
    if (iconUrl) {
      await fetchPictures(
        [
          {
            type: 'source_icon',
            source_id: source.id,
            logo_url: joinUrl(source.url, iconUrl),
          },
        ],
        {
          logger,
        },
      );
    } else {
      await SourceRepo.updates.lastLogoFetchedAt(source.id);
      logger.info(`source ${source.id} icon not found`);
    }
  } finally {
    context.close();
  }

  //
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
