import { identity, omit, pick } from 'lodash';

import {
  ApiAuthMe,
  ApiBookDetail,
  ApiBookSummary,
  ApiChapter,
  ApiSource,
} from './types';
import {
  del,
  endpointUrl,
  FailedToFetchError,
  get,
  json,
  post,
  put,
} from './utils';

export const defaultApiRetry = (retryCount: number, error: unknown) => {
  if (error instanceof FailedToFetchError) {
    return false;
  }
  return retryCount < 3;
};

export const API = {
  auth: {
    config: get({
      path: '/auth/config',
      result: json<{
        google: {
          client_id: string;
          redirect_url: string;
        } | null;
      }>,
    }),
    google: {
      startSSO: endpointUrl('/auth/google'),
    },
    me: get({
      path: '/auth/me',
      result: json<{
        user: ApiAuthMe;
      }>,
      options: {
        credentials: 'include',
      },
    }),
    logout: del({
      path: '/auth',
      options: {
        credentials: 'include',
      },
    }),
  },
  sources: {
    list: get({
      path: '/sources',
      result: json<ApiSource[]>,
      options: {
        credentials: 'include',
      },
    }),
    subscribe: post({
      path: ({ id }: { id: string }) => `/sources/${id}/subscribe`,
      options: {
        credentials: 'include',
      },
    }),
    subscribeMany: post({
      path: '/sources/subscribe',
      body: identity<{ source_ids: string[] }>,
      result: json<{}>,
      options: {
        credentials: 'include',
      },
    }),
    refetchMany: post({
      path: '/sources/refetch',
      body: identity<{ source_ids: string[] }>,
      result: json<{}>,
      options: {
        credentials: 'include',
      },
    }),
    unsubscribe: del({
      path: ({ id }: { id: string }) => `/sources/${id}/subscribe`,
      options: {
        credentials: 'include',
      },
    }),
  },
  books: {
    list: get({
      path: '/books',
      query: (params: { bookmarked?: boolean; has_unrad?: boolean }) =>
        pick(params, ['bookmarked', 'has_unread']),
      result: json<{ books: ApiBookSummary[] }>,
      options: {
        credentials: 'include',
      },
    }),

    bookmark: post({
      path: ({ id }: { id: string }) => `/books/${id}/bookmark`,
      result: json<{ book: ApiBookSummary }>,
      options: {
        credentials: 'include',
      },
    }),
    unbookmark: del({
      path: ({ id }: { id: string }) => `/books/${id}/bookmark`,
      result: json<{ book: ApiBookSummary }>,
      options: {
        credentials: 'include',
      },
    }),

    get: get({
      path: ({ id }: { id: string }) => `/books/${id}`,
      result: json<{
        book: ApiBookDetail;
      }>,
      options: {
        credentials: 'include',
      },
    }),
    refetch: post({
      path: ({ id }: { id: string }) => `/books/${id}/refetch`,
      result: json<{ book: ApiBookDetail }>,
      options: {
        credentials: 'include',
      },
    }),

    chapters: {
      get: get({
        path: ({ bookId, chapterId }: { bookId: string; chapterId: string }) =>
          `/books/${bookId}/chapter/${chapterId}`,
        result: json<{
          chapter: ApiChapter;
        }>,
        options: {
          credentials: 'include',
        },
      }),
      saveReadProgress: put({
        path: ({
          chapterId,
        }: {
          chapterId: string;
          percentage: number;
          page: number;
        }) => `/chapters/${chapterId}/read-progress`,
        body: (arg) => omit(arg, ['chapterId']),
        result: json<{
          chapter: ApiChapter;
        }>,
        options: {
          credentials: 'include',
        },
      }),
      source: {
        raw: get({
          path: ({ id }: { id: string }) => `/chapters/${id}/source/raw`,
          result: json<{ content: string | null } | null>,
        }),
        options: {
          credentials: 'include',
        },
      },
    },
  },
  chapters: {
    update: {
      readProgressMany: put({
        path: '/chapters/read-progress',
        body: (body: {
          chapters: { id: string; read: boolean }[];
          bookId?: string;
        }) => omit(body, ['bookId']),
        result: json<{}>,
        options: {
          credentials: 'include',
        },
      }),
    },
  },
};
