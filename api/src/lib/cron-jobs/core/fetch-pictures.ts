import { config } from 'config';
import { s3client } from 'lib/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { SourceRepo } from 'data/repo/source';
import sharp from 'sharp';
import { BookRepo } from 'data/repo/books-repo';
import { WebStreamToNodeStream } from 'lib/utils/stream/readablestream-to-readable';
import { Logger } from 'pino';
import { defaultLogger } from 'config/logger';

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
        const upload = new Upload({
          client: s3client,
          params: {
            Bucket: config.get('s3.bucket.book_cover'),
            Key: key,
            Body: res.body,
          },
        });
        const uploadRes = await upload.done();
        await SourceRepo.books.update.cover({
          sourceId: job.source_id,
          bookId: job.source_book_id,
          coverUrl: uploadRes.Location!,
          coverOriginUrl: job.img_url,
        });
        logger.info(
          `[fetch-picture] Book cover updated for ${job.source_id}/${job.source_book_id}`,
        );
        continue;
      }
      case 'chapter_pages': {
        const uploadedPages: {
          url: string;
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

          const upload = new Upload({
            client: s3client,
            params: {
              Bucket: config.get('s3.bucket.chapter_pages'),
              Key: key,
              Body: sharpStream,
            },
          });

          const uploadRes = await upload.done();
          const [meta] = await Promise.all(promises);
          uploadedPages.push({
            url: uploadRes.Location!,
            width: meta.width!,
            height: meta.height!,
          });
        }
        await BookRepo.chapters.updates.pages({
          sourceBookId: job.source_book_id,
          sourceChapterId: job.source_chapter_id,
          pages: uploadedPages,
        });
        logger.info(
          `[fetch-picture] Chapter pages updated for ${job.source_id}/${job.source_book_id}/${job.source_chapter_id}`,
        );
        return;
      }
      default:
    }
  }
};
