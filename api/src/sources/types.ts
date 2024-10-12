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
  /**
   * Execute operation on current page
   */
  map: <MapOp extends Op>(op: MapOp) => OpOutput<MapOp>;
};
export type FetcherSession = {
  go: (url: string) => Promise<FetchPage>;
};

export type SourceContext = {
  initFetcherSession: (options?: {
    /**
     * @default context sourceId
     */
    sessionId?: string;
    baseUrl?: string;
  }) => Promise<FetcherSession>;

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
        url: string;
      }[];
    }) => Promise<void>;
  };
};

export type ISource = {
  id: string;
  name: string;
  url: string;

  entries: {
    fetchLatests: (context: SourceContext) => void | Promise<void>;

    book: {
      details: (
        params: { sourceBookId: string },
        context: SourceContext,
      ) => void | Promise<void>;
      fetchChapter: (
        params: {
          sourceBookId: string;
          chapterId: string;
        },
        context: SourceContext,
      ) => void | Promise<void>;
    };
  };
};
