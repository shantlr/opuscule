import { API } from '@/common/api';
import { createUseMutation } from '@/common/api/create-use-mutation';
import { createUseQuery } from '@/common/api/create-use-query';
import { QUERY_KEYS } from '@/common/api/keys';

export const useSources = createUseQuery(API.sources.list, {
  queryKey: QUERY_KEYS.sources({}),
});

export const useSubscribeSource = createUseMutation(API.sources.subscribe, {
  onSuccess: ({ queryClient }) => {
    queryClient.invalidateQueries(QUERY_KEYS.sources({}));
  },
});
export const useUnsubscribeSource = createUseMutation(API.sources.unsubscribe, {
  onSuccess: ({ queryClient }) => {
    queryClient.invalidateQueries(QUERY_KEYS.sources({}));
  },
});
