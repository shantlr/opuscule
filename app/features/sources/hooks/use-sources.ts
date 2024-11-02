import { API } from '@/common/api';
import { createUseQuery } from '@/common/api/create-use-query';

export const useSources = createUseQuery(API.sources.list, {
  queryKey: ['sources'],
});
