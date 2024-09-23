import got from 'got';

export type Cookie = {
  domain?: string;
  expiry?: number;
  httpOnly?: boolean;
  name: string;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  value: string;
};

export const startSession = async ({ url }: { url: string }) => {
  const res = await got.post<{
    status: 'ok';
    solution: {
      status: number;
      response: string;
      url: string;
      cookies: Cookie[];
      userAgent: string;
      headers: Record<string, string>;
      startTimestamp: number;
      endTimestamp: number;
      version: string;
    };
  }>('http://localhost:8191/v1', {
    json: {
      cmd: 'request.get',
      url,
      maxTimeout: 60 * 1000,
    },
    responseType: 'json',
  });
  return res.body;
};
