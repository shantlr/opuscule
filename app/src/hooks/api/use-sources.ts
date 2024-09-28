import { API } from '../../components/api';
import { createUseQuery } from './create-use-query';

export const useSources = createUseQuery(API.sources.list, {
  queryKey: ['sources'],
});
