import {
  QueryClient,
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from 'react-query';

export const createUseMutation = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MutationFn extends (...args: any[]) => any,
>(
  fn: MutationFn,
  preOptions?: {
    onSuccess?: (arg: {
      data: Awaited<ReturnType<MutationFn>>;
      variables: Parameters<MutationFn>[0];
      context: unknown;
      queryClient: QueryClient;
    }) => void;
  },
) => {
  return (
    hookOptions?: Omit<
      UseMutationOptions<
        Awaited<ReturnType<MutationFn>>,
        unknown,
        Parameters<MutationFn>[0]
      >,
      'mutationFn'
    >,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<
      Awaited<ReturnType<MutationFn>>,
      unknown,
      Parameters<MutationFn>[0]
    >({
      ...hookOptions,
      mutationFn: fn,
      onSuccess(data, variables, context) {
        preOptions?.onSuccess?.({
          data,
          variables,
          context,
          queryClient,
        });

        hookOptions?.onSuccess?.(data, variables, context);
      },
    });
  };
};
