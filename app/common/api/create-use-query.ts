import { useQuery, QueryKey } from 'react-query';

import { FlattenObject } from '@/utils/ts-utils';

const createUseQuery = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryFn extends (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  NotOverrideabledArgs extends Partial<Parameters<QueryFn>[0]> = {},
  HookArgs extends Omit<
    Partial<Parameters<QueryFn>[0]>,
    keyof NotOverrideabledArgs
  > = FlattenObject<
    Omit<Partial<Parameters<QueryFn>[0]>, keyof NotOverrideabledArgs>
  >,
>(
  fn: QueryFn,
  {
    queryKey,
    params,
    enabled,
  }: {
    queryKey: QueryKey | ((args: Parameters<QueryFn>[0]) => QueryKey);
    params?: NotOverrideabledArgs;
    enabled?: (args: HookArgs) => boolean;
  },
) => {
  const useApiQuery = (hookArgs: HookArgs) => {
    const isEnabled = typeof enabled === 'function' ? enabled(hookArgs) : true;
    return useQuery<Awaited<ReturnType<QueryFn>>>({
      queryFn: () =>
        fn({
          ...hookArgs,
          ...params,
        }),
      queryKey: !isEnabled
        ? []
        : typeof queryKey === 'function'
          ? queryKey(hookArgs)
          : queryKey,
      enabled: isEnabled,
    });
  };

  return useApiQuery;
};

export { createUseQuery };
