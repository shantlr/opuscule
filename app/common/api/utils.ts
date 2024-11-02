import { API_URL } from '@/common/env';

export const json = <T>(response: Response) => response.json() as Promise<T>;

export const identity = <T>(value: T) => value;

type FetchConfg<Args, Result, Query = unknown, Body = unknown> = {
  path: string | ((args: Args) => string);
  body?: (args: Args) => Body;
  query?: (args: Args) => Query;
  result?: (response: Response) => Result;
};

export const baseCreateFetcher = <Args, Result, Body, Query>({
  path: resolvePath,
  method,
  body: resolveBody,
  query: resolveQuery,
  result = (res) => res as unknown as Result,
}: FetchConfg<Args, Result, Query, Body> & { method: string }) => {
  return async (args: Args): Promise<Awaited<Result>> => {
    const p =
      typeof resolvePath === 'function' ? resolvePath(args) : resolvePath;

    const headers: HeadersInit = {};
    let body: BodyInit | undefined = undefined;

    const data =
      typeof resolveBody === 'function' ? resolveBody(args) : undefined;

    if (data && typeof data === 'object') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    let url = `${API_URL}${p}`;

    const query =
      typeof resolveQuery === 'function' ? resolveQuery(args) : undefined;

    if (query) {
      if (query instanceof URLSearchParams) {
        url += `?${query.toString()}`;
      } else {
        const params = new URLSearchParams();
        for (const key in query) {
          if (Array.isArray(query[key])) {
            for (const value of query[key] as string[]) {
              params.append(key, value);
            }
          } else {
            params.append(key, query[key] as string);
          }
        }
        url += `?${params.toString()}`;
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    return await result(res);
  };
};

export const get = <Args, Result>(config: FetchConfg<Args, Result>) =>
  baseCreateFetcher({
    ...config,
    method: 'GET',
  });

export const post = <Args, Result, Body, Query>(
  config: FetchConfg<Args, Result, Body, Query>,
) =>
  baseCreateFetcher({
    ...config,
    method: 'POST',
  });

export const put = <Args, Result, Body, Query>(
  config: FetchConfg<Args, Result, Body, Query>,
) =>
  baseCreateFetcher({
    ...config,
    method: 'PUT',
  });

export const del = <Args, Result, Body, Query>(
  config: FetchConfg<Args, Result, Body, Query>,
) =>
  baseCreateFetcher({
    ...config,
    method: 'DELETE',
  });
