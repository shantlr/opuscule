import { useQuery, QueryKey, UseQueryOptions } from 'react-query';

import { FlattenObject } from '@/utils/ts-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookOptions<QueryFn extends (...args: any[]) => any> = UseQueryOptions<
  Parameters<QueryFn>[0],
  unknown,
  Awaited<ReturnType<QueryFn>>
>;

type CreatedHookOptions<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryFn extends (...args: any[]) => any,
  HookArgs,
> = [HookArgs] extends [Record<string, never> | undefined]
  ? HookOptions<QueryFn> & { params?: HookArgs }
  : HookOptions<QueryFn> & { params: HookArgs };

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
    ...options
  }: {
    queryKey: QueryKey | ((args: Parameters<QueryFn>[0]) => QueryKey);
    params?: NotOverrideabledArgs;
    enabled?: (args: HookArgs) => boolean;
    retry?: HookOptions<QueryFn>['retry'];
  },
) => {
  const useApiQuery = (hookArgs: CreatedHookOptions<QueryFn, HookArgs>) => {
    const isEnabled =
      typeof enabled === 'function'
        ? enabled({
            ...hookArgs.params,
            ...params,
          } as HookArgs)
        : true;

    return useQuery<Awaited<ReturnType<QueryFn>>>({
      ...options,
      ...hookArgs,
      queryFn: () =>
        fn({
          ...hookArgs?.params,
          ...params,
        }),
      queryKey: !isEnabled
        ? []
        : typeof queryKey === 'function'
          ? queryKey(hookArgs.params)
          : queryKey,
      enabled: isEnabled,
    });
  };

  return useApiQuery;
};

export { createUseQuery };
