import { config } from 'config';
import { s3client } from 'lib/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { SourceRepo } from 'data/repo/source';

export type FetchPictureJob = {
  type: 'source_book_cover';
  source_id: string;
  source_book_id: string;
  img_url: string;
};

export const fetchPictures = async (jobs: FetchPictureJob[]) => {
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
        console.log(
          `[fetch-picture] Book cover updated for ${job.source_id}/${job.source_book_id}`,
        );
        continue;
      }
      default:
    }
  }
};
