const BASE_URL = import.meta.env.VITE_API_URL;

export const result = <T>(data: T) => data;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchConfg<Args, Result = any, MappedResult = Result> = {
  path: string | ((args: Args) => string);
  body?: (args: Args) => Record<string, unknown>;
  query?: (args: Args) => Record<string, unknown>;
  responseType?: 'json' | 'text';
  result?: (data: Result) => MappedResult;
};

export const baseCreateFetcher = <Args, Result, MappedResult>({
  path,
  method,
  responseType,
}: FetchConfg<Args, Result, MappedResult> & { method: string }) => {
  return async (args: Args): Promise<MappedResult> => {
    const p = typeof path === 'function' ? path(args) : path;

    const url = `${BASE_URL}${p}`;
    const res = await fetch(url, {
      method,
    });
    if (responseType === 'json') {
      return res.json();
    }
    if (responseType === 'text') {
      return res.text() as Promise<MappedResult>;
    }

    return res as unknown as Promise<MappedResult>;
  };
};

export const get = <Result, MappedResult>(
  config: FetchConfg<Result, MappedResult>,
) =>
  baseCreateFetcher({
    ...config,
    method: 'GET',
    responseType: config.responseType ?? 'json',
  });
