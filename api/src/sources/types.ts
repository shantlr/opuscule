import { SourceContext } from './lib/types';

export type ISource<Id extends string = string> = {
  id: Id;
  name: string;
  url: string;

  formatChapterUrl: (arg: {
    sourceBookKey: string;
    chapterId: string;
  }) => string;

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
