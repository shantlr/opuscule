import * as cheerio from 'cheerio';
import { defaultLogger } from 'config/logger';
import { FetchSessionRepo } from 'data/repo/fetch-sessions';
import { HtmlCacheRepo } from 'data/repo/html-cache';
import { startSession } from 'lib/flare-solverr';
import { joinUrl } from 'lib/utils/join-url';
import { execOperations } from 'sources/lib/exec-op';

import { FetcherSession, FetchPage, SourceContext } from '../types';

const createPage = ({ data }: { data: string }): FetchPage => {
  const $ = cheerio.load(data);
  const page: FetchPage = {
    html: data,
    map: (op) => {
      return execOperations($, op);
    },
  };

  return page;
};
const createFetcher = async (
  session: NonNullable<
    Awaited<ReturnType<(typeof FetchSessionRepo)['get']['byKey']>>
  >,
  logger = defaultLogger,
) => {
  const log = logger.scope('fetcher-session');

  return {
    async fetch(url: string, options?: RequestInit) {
      const cacheKey = `${session.key}:${url}`;
      const cacheData = await HtmlCacheRepo.get.byUrl(cacheKey);
      if (cacheData?.data) {
        log.info(`[fetcher-session] resolved page from cache '${cacheKey}'`);
        return cacheData.data;
      }

      const res = await fetch(url, {
        headers: {
          ...options?.headers,
          'User-Agent': session.user_agent,
        },
      });
      log.info(`[fetcher-session] fetched page '${url}': ${res.status}`);

      const result = await res.text();

      await HtmlCacheRepo.create(cacheKey, result, res.status);

      return result;
    },
  };
};

export const createFetcherSession = async (
  sessionId: string,
  prevSession: Awaited<ReturnType<(typeof FetchSessionRepo)['get']['byKey']>>,
  options: Parameters<SourceContext['initFetcherSession']>[0],
  logger = defaultLogger,
): Promise<FetcherSession> => {
  const log = logger.scope('fetcher-session');
  let currentFetchSession = prevSession;

  let fetcher = currentFetchSession
    ? await createFetcher(currentFetchSession)
    : null;

  if (currentFetchSession && fetcher) {
    log.info(`[fetcher-session] reusing session '${sessionId}'`);
  }

  const session: FetcherSession = {
    go: async (path: string) => {
      const url = options?.baseUrl ? joinUrl(options.baseUrl, path) : path;

      if (fetcher) {
        const res = await fetcher.fetch(url);
        return createPage({
          data: res,
        });
      }

      // start new session
      log.info(`[fetcher-session] starting new session for '${url}'`);
      const flareRes = await startSession({ url });
      currentFetchSession = await FetchSessionRepo.create({
        key: sessionId,
        cookies: flareRes.solution.cookies.map((c) => ({
          ...c,
          url,
        })),
        user_agent: flareRes.solution.userAgent,
      });
      const cacheKey = `${currentFetchSession.key}:${url}`;
      await HtmlCacheRepo.create(
        cacheKey,
        flareRes.solution.response,
        flareRes.solution.status,
      );

      fetcher = await createFetcher(currentFetchSession);
      return createPage({
        data: flareRes.solution.response,
      });
    },
  };
  return session;
};
