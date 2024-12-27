import convict from 'convict';

export const config = convict({
  service: {
    name: {
      env: 'SERVICE_NAME',
      default: 'api',
    },
    port: {
      env: 'SERVICE_PORT',
      default: 4560,
    },

    protocol: {
      env: 'SERVICE_PROTOCOL',
      default: 'http',
    },
    host: {
      env: 'SERVICE_HOST',
    },
  },
  db: {
    path: {
      env: 'DB_PATH',
      default: './data/sqlite.db',
    },
  },
  chapter: {
    page: {
      s3KeyRand: {
        seed: {
          doc: `Seed for generating random key for chapter page S3 key, this avoid pages being scrapped`,
          env: 'CHAPTER_PAGE_S3_KEY_RAND_SEED',
          default: '',
        },
      },
    },
  },
  s3: {
    endPoint: {
      env: 'S3_ENDPOINT',
      default: 'http://localhost:9000',
    },
    region: {
      env: 'S3_REGION',
      default: null,
    },
    accessKey: {
      env: 'S3_ACCESS_KEY',
      default: '',
    },
    secretKey: {
      env: 'S3_SECRET_KEY',
      default: '',
    },

    bucket: {
      book_cover: {
        env: 'S3_BUCKET_BOOK_COVER',
        default: 'opuscule-books-cover',
      },
      chapter_pages: {
        env: 'S3_BUCKET_CHAPTER_PAGE',
        default: 'opuscule-chapter-pages',
      },
    },
  },

  app: {
    url: {
      env: 'APP_URL',
      default: 'http://localhost:8081',
    },
  },

  auth: {
    session: {
      cookie: {
        name: {
          env: 'AUTH_SESSION_COOKIE_NAME',
          default: 'opuscule',
        },
        sameSite: {
          env: 'AUTH_SESSION_COOKIE_SAME_SITE',
          default: 'lax',
        },
        secure: {
          env: 'AUTH_SESSION_COOKIE_SECURE',
          coerce: (val: unknown) => val === 'true',
          default: true,
        },
        domain: {
          env: 'AUTH_SESSION_COOKIE_DOMAIN',
          default: null as string | null,
        },
      },
      duration: {
        seconds: {
          env: 'AUTH_SESSION_DURATION_SECONDS',
          doc: 'Duration of session in seconds',
          default: 15 * 60,
        },
      },
      maxDuration: {
        seconds: {
          env: 'AUTH_SESSION_MAX_DURATION_SECONDS',
          doc: 'Max duration of session in seconds',
          default: 30 * 24 * 60 * 60,
        },
      },
    },
  },

  google: {
    oauth: {
      encrypt: {
        refresh: {
          token: {
            secret: {
              env: 'GOOGLE_OAUTH_ENCRYPT_REFRESH_TOKEN_SECRET',
              default: '',
            },
          },
        },
      },
      state: {
        limit: {
          env: 'GOOGLE_OAUTH_STATE_LIMIT',
          doc: 'Limit of state cache',
          default: 5000,
        },
        ttlSeconds: {
          env: 'GOOGLE_OAUTH_STATE_TTL_SECONDS',
          doc: 'TTL of state cache',
          default: 5 * 60,
        },
      },
      clientId: {
        env: 'GOOGLE_OAUTH_CLIENT_ID',
        default: null,
      },
      redirectUrl: {
        env: 'GOOGLE_OAUTH_REDIRECT_URL',
        default: 'http://localhost:4560/auth/google/callback',
      },
      secret: {
        env: 'GOOGLE_OAUTH_SECRET',
        default: null,
      },
    },
  },
  flaresolverr: {
    url: {
      env: 'FLARESOLVERR_URL',
      default: 'http://localhost:8191',
    },
  },

  api: {
    cors: {
      origin: {
        env: 'API_CORS_ORIGIN',
        default: 'http://localhost:8081',
      },
    },
  },
});
