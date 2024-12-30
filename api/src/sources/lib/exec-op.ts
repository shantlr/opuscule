import type * as cheerio from 'cheerio';
import { logger } from 'config/logger';
import { optional } from 'zod';

import { Op } from './types';
import { Query } from './types';
import { OpOutput } from './types';

const getElem = (
  $: cheerio.CheerioAPI,
  selector: Query | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: cheerio.Cheerio<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): cheerio.Cheerio<any> => {
  if (!selector) {
    if (!context) {
      return $.root();
    }
    return $(context);
  }
  if (typeof selector === 'string') {
    if (context) {
      const elem = $(context);
      return elem.find(selector);
    }

    return $(selector);
  }

  let currentContext = context;
  if (selector.selector) {
    currentContext = getElem($, selector.selector, context);
  }

  if (Array.isArray(selector.or)) {
    const elems = selector.or.map((o) => getElem($, o, currentContext));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return $(elems);
  }

  return $(currentContext);
};

export const execOperations = <O extends Op>(
  $: cheerio.CheerioAPI,
  op: O,
  {
    context,
  }: {
    context?: cheerio.Cheerio<unknown>;
  } = {},
): OpOutput<O> => {
  switch (op.type) {
    case 'text': {
      const elem = getElem($, op.query, context);
      const text = elem.text();
      if (op.includes && !text.includes(op.includes)) {
        return '' as OpOutput<O>;
      }
      return text as OpOutput<O>;
    }
    case 'exist': {
      const res = execOperations($, op.value, { context });
      return !!res as OpOutput<O>;
    }
    case 'attr': {
      const elem = getElem($, op.query, context);
      if (!elem) {
        if (!optional) {
          throw new Error(`[exec-op] elem matching '${op.query}' not found`);
        }

        logger.warn(`[exec-op] elem matching '${op.query}' not found`);
      }
      return elem.attr(op.name) as OpOutput<O>;
    }
    case 'object': {
      const elem = getElem($, op.query, context);
      const res: Record<string, unknown> = Object.fromEntries(
        Object.entries(op.fields).map(([key, value]) => [
          key,
          execOperations($, value, { context: elem }),
        ]),
      );

      return res as OpOutput<O>;
    }
    case 'map': {
      const res: unknown[] = [];

      const elems = getElem($, op.query, context);
      elems.each((index, el) => {
        const item: Record<string, unknown> = {};
        for (const key in op.item) {
          item[key] = execOperations($, op.item[key], { context: el });
        }
        res.push(item);
      });

      return res as OpOutput<O>;
    }
    default:
  }
  throw new Error(`Unknown operation type: ${JSON.stringify(op)}`);
};
