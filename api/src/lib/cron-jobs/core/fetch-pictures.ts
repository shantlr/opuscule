import { config } from 'config';
import { s3client } from 'lib/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { SourceRepo } from 'data/repo/source';
import sharp from 'sharp';
import { BookRepo } from 'data/repo/books-repo';
import { WebStreamToNodeStream } from 'lib/utils/stream/readablestream-to-readable';
import { defaultLogger, Logger } from 'config/logger';

export type FetchPictureJob =
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
        log.info(
          `book cover updated for ${job.source_id}/${job.source_book_id}`,
        );
        continue;
      }
      case 'chapter_pages': {
        const uploadedPages: {
          s3_key: string;
          s3_bucket: string;
          width: number;
          height: number;
        }[] = [];
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

          const key = `${job.source_id}__${job.source_book_id}__${job.source_chapter_id}__${index}${ext}`;
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
