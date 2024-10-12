import { ApiBookDetail, ApiBookSummary, ApiChapter, ApiSource } from './types';
import { get, json, post } from './utils';

export const API = {
  sources: {
    list: get({
      path: '/sources',
      result: json<ApiSource[]>,
    }),
  },
  books: {
    list: get({
      path: '/books',
      result: json<{ books: ApiBookSummary[] }>,
    }),

    get: get({
      path: ({ id }: { id: string }) => `/books/${id}`,
      result: json<{
        book: ApiBookDetail;
      }>,
    }),
    refetch: post({
      path: ({ id }: { id: string }) => `/books/${id}/refetch`,
      result: json<{ book: ApiBookDetail }>,
    }),

    chapters: {
      get: get({
        path: ({ bookId, chapterId }: { bookId: string; chapterId: string }) =>
          `/books/${bookId}/chapter/${chapterId}`,
        result: json<{
          chapter: ApiChapter;
        }>,
      }),
    },
  },
};
