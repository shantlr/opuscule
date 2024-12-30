import * as cheerio from 'cheerio';
import { joinUrl } from 'lib/utils/join-url';
import { chromium } from 'playwright-extra';
import playwrightStealth from 'puppeteer-extra-plugin-stealth';
import { execOperations } from 'sources/lib/exec-op';

import { FetcherSession } from '../types';

chromium.use(playwrightStealth());

export const createPlaywrightFetcher = async ({
  baseUrl,
}: {
  baseUrl?: string;
} = {}): Promise<FetcherSession> => {
  const browser = await chromium.launch({
    // headless: false,
  });
  const context = await browser.newContext();

  await context.route('**.webp', (route) => route.abort());
  const page = await context.newPage();

  let closed = false;

  return {
    go: async (inputUrl: string) => {
      const url = baseUrl ? joinUrl(baseUrl, inputUrl) : inputUrl;
      await page.goto(url);
      const html = await page.content();

      return {
        html,
        map: (op) => {
          const $ = cheerio.load(html);
          return execOperations($, op);
        },
      };
    },
    close: async () => {
      if (closed) {
        return;
      }
      await context.close();
      closed = true;
    },
  };
};
