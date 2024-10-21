import { API } from 'config/api';
import { createUseQuery } from './create-use-query';
import { createUseMutation } from './create-use-mutation';
import { QUERY_KEYS } from './keys';

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
