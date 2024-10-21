import { pick } from 'lodash';
import { ApiBookDetail, ApiBookSummary, ApiChapter, ApiSource } from './types';
import { del, get, json, post } from './utils';

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
      query: (params: { bookmarked?: boolean }) => pick(params, ['bookmarked']),
      result: json<{ books: ApiBookSummary[] }>,
    }),

    bookmark: post({
      path: ({ id }: { id: string }) => `/books/${id}/bookmark`,
      result: json<{ book: ApiBookSummary }>,
    }),
    unbookmark: del({
      path: ({ id }: { id: string }) => `/books/${id}/bookmark`,
      result: json<{ book: ApiBookSummary }>,
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
