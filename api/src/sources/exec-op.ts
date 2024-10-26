import { optional } from 'zod';
import { Op, OpOutput, Query } from './types';
import { logger } from 'config/logger';
import type * as cheerio from 'cheerio';

const getElem = (
  $: cheerio.CheerioAPI,
  selector: Query | undefined,
  context?: cheerio.Cheerio<any>,
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
    context?: cheerio.Cheerio<any>;
  } = {},
): OpOutput<O> => {
  switch (op.type) {
    case 'text': {
      const elem = getElem($, op.query, context);
      const text = elem.text();
      if (op.includes && !text.includes(op.includes)) {
        return '' as any;
      }
      return text as any;
    }
    case 'exist': {
      const res = execOperations($, op.value, { context });
      return !!res as any;
    }
    case 'attr': {
      const elem = getElem($, op.query, context);
      if (!elem) {
        if (!optional) {
          throw new Error(`[exec-op] elem matching '${op.query}' not found`);
        }

        logger.warn(`[exec-op] elem matching '${op.query}' not found`);
      }
      return elem.attr(op.name) as any;
    }
    case 'object': {
      const elem = getElem($, op.query, context);
      const res: Record<string, any> = Object.fromEntries(
        Object.entries(op.fields).map(([key, value]) => [
          key,
          execOperations($, value, { context: elem }),
        ]),
      );

      return res as OpOutput<O>;
    }
    case 'map': {
      const res: any[] = [];

      const elems = getElem($, op.query, context);
      elems.each((index, el) => {
        const item: Record<string, any> = {};
        for (const key in op.item) {
          item[key] = execOperations($, op.item[key], { context: el });
        }
        res.push(item);
      });

      return res as any;
    }
    default:
  }
  throw new Error(`Unknown operation type: ${JSON.stringify(op)}`);
};
