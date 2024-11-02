export type Identity<T> = T;

export type FlattenObject<T> = Identity<{
  [K in keyof T]: T[K];
}>;
