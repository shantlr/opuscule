import { omit } from 'lodash';

import { API } from '@/common/api';
import { createUseMutation } from '@/common/api/create-use-mutation';
import { createUseQuery } from '@/common/api/create-use-query';
import { QUERY_KEYS } from '@/common/api/keys';

export const useLastUpdatedBooks = createUseQuery(API.books.list, {
  queryKey: QUERY_KEYS.books.latests({}),
});

export const useBookmarkedBooks = createUseQuery(API.books.list, {
  queryKey: QUERY_KEYS.books.bookmarked({}),
  params: {
    bookmarked: true,
  },
});

export const useBook = createUseQuery(API.books.get, {
  queryKey: ({ id }) => QUERY_KEYS.books.id.details({ bookId: id! }),
  enabled: ({ id }) => !!id,
});

export const useBookChapter = createUseQuery(API.books.chapters.get, {
  queryKey: ({ bookId, chapterId }) =>
    QUERY_KEYS.books.id.chapters.id({
      bookId: bookId!,
      chapterId: chapterId!,
    }),
  enabled: ({ bookId }) => !!bookId,
});

export const useBookRefetch = createUseMutation(API.books.refetch, {
  onSuccess: ({ variables, queryClient }) => {
    queryClient.invalidateQueries(
      QUERY_KEYS.books.id({ bookId: variables.id }),
    );
  },
});

export const useBookmarkBook = createUseMutation(API.books.bookmark, {
  onSuccess: ({ queryClient }) => {
    queryClient.invalidateQueries(QUERY_KEYS.books({}));
  },
});

export const useUnbookmarkBook = createUseMutation(API.books.unbookmark, {
  onSuccess: ({ queryClient }) => {
    queryClient.invalidateQueries(QUERY_KEYS.books({}));
  },
});

export const useSaveReadProgress = createUseMutation(
  (
    params: Parameters<
      (typeof API)['books']['chapters']['saveReadProgress']
    >[0] & {
      bookId: string;
    },
  ) => API.books.chapters.saveReadProgress(omit(params, 'bookId')),
  {
    onSuccess({ queryClient, variables }) {
      const chapterQueryKey = QUERY_KEYS.books.id.chapters.id({
        bookId: variables.bookId,
        chapterId: variables.chapterId,
      });
      const queryData = queryClient.getQueryData(chapterQueryKey) as Awaited<
        ReturnType<(typeof API)['books']['chapters']['get']>
      >;

      if (queryData) {
        queryClient.setQueryData(chapterQueryKey, {
          ...queryData,
          user_state: {
            ...queryData.user_state,
            percentage: variables.percentage,
            page: variables.page,
            read: variables.percentage > 0.98,
          },
        });
      }
    },
  },
);
