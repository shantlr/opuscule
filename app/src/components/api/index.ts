import { ApiBookDetail, ApiBookSummary, ApiChapter, ApiSource } from './types';
import { get, result } from './utils';

export const API = {
  sources: {
    list: get({
      path: '/sources',
      result: result<ApiSource[]>,
    }),
  },
  books: {
    get: get({
      path: ({ id }: { id: string }) => `/books/${id}`,
      result: result<{
        book: ApiBookDetail;
      }>,
    }),
    list: get({
      path: '/books',
      result: result<{ books: ApiBookSummary[] }>,
    }),
    chapters: {
      get: get({
        path: ({ bookId, chapterId }: { bookId: string; chapterId: string }) =>
          `/books/${bookId}/chapter/${chapterId}`,
        result: result<{
          chapter: ApiChapter;
        }>,
      }),
    },
  },
};
