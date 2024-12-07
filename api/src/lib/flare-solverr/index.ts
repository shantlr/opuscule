import { config } from 'config';

export type FlareSolverrCookie = {
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
  const res = await fetch(config.get('flaresolverr.url'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cmd: 'request.get',
      url,
      maxTimeout: 60 * 1000,
    }),
  });

  return (await res.json()) as {
    status: 'ok';
    solution: {
      status: number;
      response: string;
      url: string;
      cookies: FlareSolverrCookie[];
      userAgent: string;
      headers: Record<string, string>;
      startTimestamp: number;
      endTimestamp: number;
      version: string;
    };
  };
};
