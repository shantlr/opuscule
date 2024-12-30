import { Logger } from 'config/logger';

export type Op = OpText | OpMap | OpAttr | OpExist | OpObject;
export type Query =
  | string
  | {
      selector?: string;
      text?:
        | string
        | {
            includes?: string;
          };
      or?: Query[];
    };
export type OpObject = {
  type: 'object';
  query?: Query;
  fields: Record<string, Op>;
};
export type OpText = {
  type: 'text';
  query?: Query;
  includes?: string;
};
export type OpExist = {
  type: 'exist';
  value: Op;
};
export type OpAttr = {
  type: 'attr';
  name: string;
  query?: Query;
  optional?: boolean;
  debug?: boolean;
};
export type OpMap = {
  type: 'map';
  query?: Query;
  item: Record<string, Op>;
};
export type OpOutput<T> = T extends OpText | OpAttr
  ? string
  : T extends OpExist
    ? boolean
    : T extends OpObject
      ? {
          [K in keyof T['fields']]: OpOutput<T['fields'][K]>;
        }
      : T extends OpMap
        ? {
            [K in keyof T['item']]: OpOutput<T['item'][K]>;
          }[]
        : never;
export type FetchPage = {
  html: string;
  /**
   * Execute operation on current page
   */
  map: <MapOp extends Op>(op: MapOp) => OpOutput<MapOp>;
  close?: () => Promise<void>;
};
export type FetcherSession = {
  go: (url: string) => Promise<FetchPage>;
  close?: () => Promise<void>;
};
export type SourceContext = {
  logger: Logger;
  initFetcherSession: (options?: {
    /**
     * @default context sourceId
     */
    sessionId?: string;
    baseUrl?: string;
    ignorePrevSession?: boolean;
  }) => Promise<FetcherSession>;

  close: () => Promise<void>;

  books: {
    upsert: (
      items: {
        id: string;
        key?: string;

        title?: string;
        titleAccuracy?: number;

        description?: string;
        descriptionAccuracy?: number;

        coverUrl?: string | null;

        chapters?: {
          id: string;
          rank: number;
          publishedAt?: Date | null;
          publishedAccuracy?: number;
          pages?: {
            url: string;
          }[];
        }[];
      }[],
    ) => Promise<void>;
  };
  chapters: {
    upsert: (chapter: {
      sourceBookId: string;
      chapterId: string;
      pages: {
        s3_key: string;
        s3_bucket: string;
        width: number;
        height: number;
      }[];
    }) => Promise<void>;
  };
};
