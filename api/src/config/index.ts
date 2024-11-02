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
  },
  db: {
    path: {
      env: 'DB_PATH',
      default: './data/sqlite.db',
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

  api: {
    cors: {
      origin: {
        env: 'API_CORS_ORIGIN',
        default: 'http://localhost:5173',
      },
    },
  },
});
