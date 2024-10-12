import { API } from 'config/api';
import { createUseQuery } from './create-use-query';
import { createUseMutation } from './create-use-mutation';

export const useLastUpdatedBooks = createUseQuery(API.books.list, {
  queryKey: ['book', 'last-updateds'],
});

export const useBook = createUseQuery(API.books.get, {
  queryKey: ({ id }) => ['book', id, 'details'],
  enabled: ({ id }) => !!id,
});

export const useBookChapter = createUseQuery(API.books.chapters.get, {
  queryKey: ({ bookId, chapterId }) => ['book', bookId, 'chapter', chapterId],
  enabled: ({ bookId }) => !!bookId,
});

export const useBookRefetch = createUseMutation(API.books.refetch, {
  onSuccess: ({ data, variables, queryClient }) => {
    queryClient.invalidateQueries(['book', variables.id]);
  },
});

export const useBookmarkBook = createUseMutation(API.books.bookmark, {
  onSuccess: ({ data, queryClient }) => {
    queryClient.invalidateQueries(['book']);
  },
});

export const useUnbookmarkBook = createUseMutation(API.books.unbookmark, {
  onSuccess: ({ data, queryClient }) => {
    queryClient.invalidateQueries(['book']);
  },
});
