import { config } from 'config';

export const GOOGLE_AUTH = {
  startSSOUrl: ({
    state,
    prompt = 'consent',
  }: {
    state: string;
    prompt?: 'none' | 'consent' | 'select_account';
  }) => {
    const params = new URLSearchParams({
      client_id: config.get('google.oauth.clientId')!,
      redirect_uri: config.get('google.oauth.redirectUrl')!,
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
      response_type: 'code',
      state: state,
      prompt,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  exchangeCodeForTokens: async ({ code }: { code: string }) => {
    const res = await fetch(`https://oauth2.googleapis.com/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.get('google.oauth.clientId')!,
        client_secret: config.get('google.oauth.secret')!,
        code,
        redirect_uri: config.get('google.oauth.redirectUrl')!,
        grant_type: 'authorization_code',
      }),
    });

    if (res.status !== 200) {
      return {
        success: false as const,
        error: 'GET_TOKEN_FAILED' as const,
        status: res.status,
      };
    }

    const r = (await res.json()) as {
      access_token: string;
      expires_in: number;
      id_token: string;
      refresh_token?: string;
      scope: string;
      token_type: string;
    };

    return {
      success: true as const,
      idToken: r.id_token,
      accessToken: r.access_token,
      refreshToken: r.refresh_token,
    };
  },
  refreshToken: async ({ refreshToken }: { refreshToken: string }) => {
    const res = await fetch(`https://oauth2.googleapis.com/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.get('google.oauth.clientId')!,
        client_secret: config.get('google.oauth.secret')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (res.status !== 200) {
      return {
        success: false,
        error: 'GET_TOKEN_FAILED' as const,
        status: res.status,
        message: await res.text(),
      };
    }
    (await res.json()) as {
      access_token: string;
      expires_in: number;
      id_token: string;
      scope: string;
      token_type: string;
    };

    return {};
  },
};
