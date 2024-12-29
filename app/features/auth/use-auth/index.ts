import { API, defaultApiRetry } from '@/common/api';
import { createUseMutation } from '@/common/api/create-use-mutation';
import { createUseQuery } from '@/common/api/create-use-query';
import { QUERY_KEYS } from '@/common/api/keys';
import { FetchError } from '@/common/api/utils';

export const useAuthConfig = createUseQuery(API.auth.config, {
  queryKey: QUERY_KEYS.auth.config({}),
});

export const useAuthMe = createUseQuery(API.auth.me, {
  queryKey: QUERY_KEYS.auth.me({}),
  retry: (retryCount, error) => {
    if (error instanceof FetchError && error.response.status === 401) {
      return false;
    }
    return defaultApiRetry(retryCount, error);
  },
});

export const useLogout = createUseMutation(API.auth.logout, {
  onSuccess: ({ queryClient }) => {
    queryClient.invalidateQueries(QUERY_KEYS.auth({}));
  },
});
