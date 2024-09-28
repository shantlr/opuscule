import { API } from 'components/api';
import { createUseQuery } from './create-use-query';

export const useLastUpdatedBooks = createUseQuery(API.books.list, {
  queryKey: ['book', 'last-updateds'],
});

export const useBook = createUseQuery(API.books.get, {
  queryKey: ({ id }) => ['book', id, 'details'],
});

export const useBookChapter = createUseQuery(API.books.chapters.get, {
  queryKey: ({ bookId, chapterId }) => ['book', bookId, 'chapter', chapterId],
});
