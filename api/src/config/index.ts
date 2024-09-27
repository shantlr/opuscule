import convict from 'convict';

export const config = convict({
  service: {
    port: {
      env: 'SERVICE_PORT',
      default: 4560,
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
