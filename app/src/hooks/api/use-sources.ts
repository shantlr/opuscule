import { API } from 'config/api';
import { createUseQuery } from './create-use-query';

export const useSources = createUseQuery(API.sources.list, {
  queryKey: ['sources'],
});
