import { API } from '@/common/api';
import { createUseQuery } from '@/common/api/create-use-query';
import { QUERY_KEYS } from '@/common/api/keys';

export const useChapterSourceRaw = createUseQuery(
  (
    variables: Parameters<typeof API.books.chapters.source.raw>[0] & {
      bookId: string;
    },
  ) => API.books.chapters.source.raw({ id: variables.id }),
  {
    queryKey: ({ id, bookId }) =>
      QUERY_KEYS.books.id.chapters.id.raw({
        bookId: bookId,
        chapterId: id,
      }),
  },
);
