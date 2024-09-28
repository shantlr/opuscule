import { useQuery, QueryKey } from 'react-query';

// interface UseApiQuery<
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   QueryFn extends (...args: any[]) => any,
//   HookArgs extends Partial<Parameters<QueryFn>[0]>,
// > {
//   (hookArgs: HookArgs): Return;
// }

const createUseQuery = <
  // QueryFn extends () => any | ((args: Record<string, any>) => any),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryFn extends (...args: any[]) => any,
  HookArgs extends Partial<Parameters<QueryFn>[0]>,
>(
  fn: QueryFn,
  {
    queryKey,
    enabled,
  }: {
    queryKey: QueryKey | ((args: HookArgs) => QueryKey);
    enabled?: (args: HookArgs) => boolean;
  },
) => {
  const useApiQuery = (hookArgs: HookArgs) => {
    return useQuery<Awaited<ReturnType<QueryFn>>>({
      queryFn: () =>
        fn({
          ...hookArgs,
        }),
      queryKey: typeof queryKey === 'function' ? queryKey(hookArgs) : queryKey,
      enabled: typeof enabled === 'function' ? enabled(hookArgs) : true,
    });
  };

  return useApiQuery;
};

export { createUseQuery };
