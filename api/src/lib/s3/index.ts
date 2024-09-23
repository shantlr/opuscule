import { S3Client } from '@aws-sdk/client-s3';

import { config } from 'config';

export const s3client = new S3Client({
  region: config.get('s3.region')!,
  credentials: {
    accessKeyId: config.get('s3.accessKey'),
    secretAccessKey: config.get('s3.secretKey'),
  },
  endpoint: config.get('s3.endPoint'),
  forcePathStyle: true,
});
