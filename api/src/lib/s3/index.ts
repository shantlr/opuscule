import { S3Client } from '@aws-sdk/client-s3';

import { config } from 'config';
import { logger } from 'config/logger';
import { getLocalIp } from 'lib/utils/get-local-ip';

let rootEndpoint = config.get('s3.endPoint');
if (rootEndpoint.startsWith('local://')) {
  rootEndpoint = rootEndpoint.replace(/^local:\/\//, `http://${getLocalIp()}`);
}

logger.scope('startup').scope('s3').info(`${rootEndpoint}`);

export const s3client = new S3Client({
  region: config.get('s3.region')!,
  credentials: {
    accessKeyId: config.get('s3.accessKey'),
    secretAccessKey: config.get('s3.secretKey'),
  },
  endpoint: rootEndpoint,
  forcePathStyle: true,
});

export const formatPublicS3Url = (bucket: string, key: string) =>
  `${rootEndpoint}/${bucket}/${key}`;
