import { API } from '@/common/api';
import { createUseQuery } from '@/common/api/create-use-query';
import { FetchError } from '@/common/api/utils';

export const useAuthConfig = createUseQuery(API.auth.config, {
  queryKey: ['auth', 'config'],
});

export const useAuthMe = createUseQuery(API.auth.me, {
  queryKey: ['auth', 'me'],
  retry: (retryCount, error) => {
    if (error instanceof FetchError && error.response.status === 401) {
      return false;
    }
    return retryCount < 3;
  },
});
