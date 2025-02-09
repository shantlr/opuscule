import crypto from 'crypto';

import { Upload } from '@aws-sdk/lib-storage';
import { config } from 'config';
import { defaultLogger, Logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { SourceRepo } from 'data/repo/source';
import { s3client } from 'lib/s3';
import { WebStreamToNodeStream } from 'lib/utils/stream/readablestream-to-readable';
import sharp from 'sharp';

export type FetchPictureJob =
  | {
      type: 'source_icon';
      source_id: string;
      logo_url: string;
    }
  | {
      type: 'source_book_cover';
      source_id: string;
      source_book_id: string;
      img_url: string;
    }
  | {
      type: 'chapter_pages';
      source_id: string;
      source_book_id: string;
      source_chapter_id: string;
      pages: {
        url: string;
      }[];
    };

export const fetchPictures = async (
  jobs: FetchPictureJob[],
  {
    logger = defaultLogger,
  }: {
    logger?: Logger;
  } = {},
) => {
  const log = logger.scope('fetch-pictures');
  for (const job of jobs) {
    switch (job.type) {
      case 'source_icon': {
        const res = await fetch(job.logo_url);
        if (!res.ok) {
          throw new Error(
            `Could not fetch source_logo '${job.logo_url}': [${res.status}] ${res.statusText}`,
          );
        }

        if (!res.body) {
          throw new Error(
            `Could not fetch source_logo '${job.logo_url}': [${res.status}] '${res.statusText}' no body`,
          );
        }

        let ext = job.logo_url.split('.').pop();
        ext = ext ? `.${ext}` : '';

        const key = `${job.source_id}_logo${ext}`;
        const bucket = config.get('s3.bucket.book_cover');
        const upload = new Upload({
          client: s3client,
          params: {
            Bucket: bucket,
            Key: key,
            Body: res.body,
          },
        });
        await upload.done();
        await SourceRepo.updates.logo({
          source_id: job.source_id,
          s3_key: key,
          s3_bucket: bucket,
        });
        logger.info(`source logo updated for ${job.source_id}`);

        continue;
      }
      case 'source_book_cover': {
        const res = await fetch(job.img_url);
        if (!res.ok) {
          throw new Error(
            `Could not fetch source_book_cover '${job.img_url}': [${res.status}] ${res.statusText}`,
          );
        }

        if (!res.body) {
          throw new Error(
            `Could not fetch source_book_cover '${job.img_url}': [${res.status}] '${res.statusText}' no body`,
          );
        }

        let ext = job.img_url.split('.').pop();
        ext = ext ? `.${ext}` : '';

        const key = `${job.source_id}__${job.source_book_id}${ext}`;
        const bucket = config.get('s3.bucket.book_cover');
        const upload = new Upload({
          client: s3client,
          params: {
            Bucket: bucket,
            Key: key,
            Body: res.body,
          },
        });
        await upload.done();
        await SourceRepo.books.update.cover({
          sourceId: job.source_id,
          bookId: job.source_book_id,
          coverS3Key: key,
          coverS3Bucket: bucket,
          coverOriginUrl: job.img_url,
        });
        log.info(`source logo updated for ${job.source_id}`);
        continue;
      }
      case 'chapter_pages': {
        const uploadedPages: {
          s3_key: string;
          s3_bucket: string;
          width: number;
          height: number;
        }[] = [];
        log.info(
          `start fetching chapter pages (${job.pages.length}) for ${job.source_id}/${job.source_book_id}/${job.source_chapter_id}...`,
        );
        for (const [index, page] of job.pages.entries()) {
          const test = await fetch(page.url, {
            method: 'GET',
          });

          const res = WebStreamToNodeStream(test.body!);
          let ext = page.url.split('.').pop();
          ext = ext ? `.${ext}` : '';

          const sharpStream = sharp({ failOn: 'none' });
          const promises = [sharpStream.metadata()];
          res.pipe(sharpStream);

          const baseKey = `${job.source_id}__${job.source_book_id}__${job.source_chapter_id}__${index}`;

          // we are adding a small random hash to the key to avoid scraping
          const randHash = crypto
            .createHash('sha256')
            .update(`${config.get('chapter.page.s3KeyRand.seed')}_${baseKey}`)
            .digest('hex');

          const key = `${baseKey}_${randHash.slice(6)}_${ext}`;

          const bucket = config.get('s3.bucket.chapter_pages');

          const upload = new Upload({
            client: s3client,
            params: {
              Bucket: bucket,
              Key: key,
              Body: sharpStream,
            },
          });

          await upload.done();
          const [meta] = await Promise.all(promises);
          uploadedPages.push({
            s3_key: key,
            s3_bucket: bucket,
            width: meta.width!,
            height: meta.height!,
          });
        }
        await BookRepo.chapters.updates.pages({
          sourceBookId: job.source_book_id,
          sourceChapterId: job.source_chapter_id,
          pages: uploadedPages,
        });
        log.info(
          `chapter pages updated for ${job.source_id}/${job.source_book_id}/${job.source_chapter_id}`,
        );
        return;
      }
      default:
    }
  }
};
