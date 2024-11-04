import { QueryKey } from 'react-query';

export const K = Symbol('Node key resolve');

type Identity<T> = T;
type FlattenType<T> = Identity<{
  [key in keyof T]: T[key];
}>;

type Key = typeof K;

type IKeyNode = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in Key]: QueryKey | ((arg: any) => QueryKey);
} & {
  [key in string]: IKeyNode;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type KeyNodeCreator<T extends IKeyNode, PrevNodeArgs = {}> = ((
  params: T[Key] extends (args: infer Arg) => QueryKey
    ? FlattenType<Arg & PrevNodeArgs>
    : PrevNodeArgs,
) => QueryKey) & {
  [key in keyof T]: KeyNodeCreator<
    T[key],
    T[Key] extends (args: infer Arg) => QueryKey
      ? Arg & PrevNodeArgs
      : PrevNodeArgs
  >;
};

type KeyTreeCreator<T extends Record<string, IKeyNode>> = {
  [key in keyof T]: KeyNodeCreator<T[key]>;
};

export const createKeyTree = <T extends IKeyNode>(
  keyTree: T,
  resolveParentKey: (any: Record<string, unknown>) => QueryKey = () => [],
): KeyTreeCreator<T> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: any = () => {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyResolver = (arg: any) => {
    const parentKey = resolveParentKey(arg);

    if (!(K in keyTree)) {
      throw new TypeError(
        `[key-tree] ${JSON.stringify(parentKey)} has no key resolver function`,
      );
    }

    const keyResolver = keyTree[K] as
      | QueryKey
      | ((arg: Record<string, unknown>) => QueryKey);

    const currentKey =
      typeof keyResolver === 'function' ? keyResolver(arg) : keyResolver;
    const resultKey = [
      ...(Array.isArray(parentKey) ? parentKey : [parentKey]),
      ...(Array.isArray(currentKey) ? currentKey : [currentKey]),
    ];
    return resultKey;
  };

  const keyCreator = new Proxy<KeyTreeCreator<T>>(
    target as unknown as KeyTreeCreator<T>,
    {
      apply(_target, _thisArg, [arg]) {
        return keyResolver(arg);
      },
      get(_, prop) {
        if (!(prop in keyTree)) {
          return undefined;
        }

        if (!(prop in target)) {
          target[prop] = createKeyTree(
            keyTree[prop as keyof typeof keyTree],
            keyResolver,
          );
        }

        return target[prop];
      },
    },
  );

  return keyCreator;
};

export const QUERY_KEYS = createKeyTree({
  // root key
  [K]: [],

  books: {
    [K]: 'books',
    latests: {
      [K]: 'latests',
    },
    bookmarked: {
      [K]: 'bookmarked',
    },
    id: {
      [K]: ({ bookId }: { bookId: string }) => bookId,
      details: {
        [K]: 'details',
      },
      chapters: {
        [K]: () => 'chapters',
        id: {
          [K]: ({ chapterId }: { chapterId: string }) => chapterId,
        },
      },
    },
  },

  sources: {
    [K]: 'sources',
  },
});
