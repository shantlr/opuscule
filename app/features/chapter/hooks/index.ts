import { API } from '@/common/api';
import { createUseMutation } from '@/common/api/create-use-mutation';
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

export const useUpdateManyChapterReadProgress = createUseMutation(
  API.chapters.update.readProgressMany,
  {
    onSuccess: ({ variables: { bookId }, queryClient }) => {
      if (bookId) {
        queryClient.invalidateQueries(
          QUERY_KEYS.books.id.details({ bookId: bookId }),
        );
      }
    },
  },
);
