import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import dayjs from 'dayjs';
import { Router } from 'express';
import { fetchBook } from 'lib/cron-jobs/fetch-book';
import { fetchChapter } from 'lib/cron-jobs/fetch-chapter';
import { formatPublicS3Url } from 'lib/s3';
import { keyBy, omit, sortBy } from 'lodash';
import { z } from 'zod';

import { SourceRepo } from '../data/repo/source';
import { Sources, fetchSourceLatests } from '../sources';

export const router = Router();

router.get('/sources', async (req, res) => {
  try {
    const subscribedSources = await SourceRepo.get.listSubscribed();

    return res.status(200).send(
      Sources.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        subscribed: subscribedSources.some((ss) => ss.id === s.id),
      })),
    );
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});

router.post('/sources/subscribe', async (req, res) => {
  try {
    const { id } = z
      .object({
        id: z.string(),
      })
      .parse(req.body);

    const source = Sources.find((s) => s.id === id);
    if (!source) {
      return res.status(400).send({
        success: false,
        error: 'UNKNOWN_SOURCE',
      });
    }

    await SourceRepo.updates.subscribe(id);
    logger.info(`[fetch-source-latests] ${source.id} started (from=subscribe)`);
    void fetchSourceLatests(source!).catch((err) => {
      logger.error(
        `[fetch-source-latests] ${source!.id} failed (from=subscribe)`,
        err,
      );
    });

    return res.status(200).send({
      success: true,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).send({
      success: false,
    });
  }
});

router.delete('/sources/:id/subscribe', async (req, res) => {
  const { id } = req.params;
  try {
    await SourceRepo.updates.unsubscribe(id);
    return res.status(200).send({
      success: true,
    });
  } catch (err) {
    logger.info(err);
    return res.status(500).send({
      success: false,
    });
  }
});

router.get('/books', async (req, res) => {
  try {
    const { bookmarked } = z
      .object({
        bookmarked: z
          .union([z.string().transform((v) => v === 'true'), z.boolean()])
          .optional(),
      })
      .parse(req.query);

    const books = await BookRepo.get.latestUpdateds({ bookmarked });
    const userStates = await BookRepo.userStates.list(
      books.map((book) => book.id),
    );
    const stateByBookId = keyBy(userStates, (state) => state.book_id);

    const mappedBooks = books.map(
      ({ cover_s3_key, cover_s3_bucket, ...book }) => {
        const chapters = book.sourceBooks.flatMap((sb) => sb.chapters);
        return {
          ...book,
          cover_url:
            !!cover_s3_key && !!cover_s3_bucket
              ? formatPublicS3Url(cover_s3_bucket, cover_s3_key)
              : null,
          bookmarked: stateByBookId[book.id]?.bookmarked ?? false,
          latests_chapters: sortBy(chapters, (c) => -c.chapter_rank)
            .slice(0, 3)
            .map(({ userState, ...chapter }) => ({
              ...chapter,
              user_state: userState,
            })),
        };
      },
    );

    return res.status(200).send({
      books: mappedBooks,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});
router.get('/books/:id', async (req, res) => {
  try {
    let book = await BookRepo.get.byIdWithChapters(req.params.id);

    // if details never fetched, fetch it
    if (book && !book.last_detail_updated_at) {
      await fetchBook(book.id);
      book = await BookRepo.get.byIdWithChapters(book.id);
    }

    if (!book) {
      return res.status(404).send();
    }

    const { cover_s3_key, cover_s3_bucket, ...rest } = book;

    return res.status(200).send({
      book: {
        ...rest,
        cover_url:
          cover_s3_key && cover_s3_bucket
            ? formatPublicS3Url(cover_s3_bucket, cover_s3_key)
            : null,
        sourceBooks: book?.sourceBooks.map((sb) => ({
          ...sb,
          chapters: sb.chapters.map(({ userState, ...chapter }) => ({
            ...chapter,
            user_state: userState,
          })),
        })),
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});
router.post('/books/:id/refetch', async (req, res) => {
  const { id } = req.params;
  try {
    const book = await BookRepo.get.byIdWithChapters(req.params.id);
    if (!book) {
      return res.status(404).send();
    }

    if (
      book.last_detail_updated_at &&
      dayjs(book.last_detail_updated_at).isAfter(dayjs().subtract(10, 'minute'))
    ) {
      return {
        book,
      };
    }

    await fetchBook(id);
    const updated = await BookRepo.get.byIdWithChapters(id);
    return res.status(200).send({
      book: updated,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});

/**
 * Subscribe to a book to automatically fetch new chapters
 */
router.post('/books/:id/bookmark', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await BookRepo.bookmark.create(id);

    if (error) {
      return res.status(400).send({ error });
    }

    return res.status(200).send({});
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});
/**
 * Unsubscribe from a book
 */
router.delete('/books/:id/bookmark', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await BookRepo.bookmark.delete(id);

    if (error) {
      return res.status(400).send({ error });
    }

    return res.status(200).send({});
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});

router.get('/books/:bookId/chapter/:chapterId', async (req, res) => {
  try {
    let chapter = await BookRepo.chapters.get.byIdWithReadProgress(
      req.params.chapterId,
    );

    if (chapter && !chapter.pages) {
      await fetchChapter({
        chapterId: chapter.id,
      });
      chapter = await BookRepo.chapters.get.byIdWithReadProgress(chapter.id);
    }

    if (!chapter) {
      return res.status(404).send();
    }

    return res.status(200).send({
      chapter: {
        ...omit(chapter, 'userState'),
        pages: (chapter.pages as any[]).map((page) => ({
          ...omit(page, ['s3_bucket', 's3_key']),
          url: formatPublicS3Url(page.s3_bucket, page.s3_key),
        })),
      },
      user_state: chapter.userState,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});

router.put(`/chapters/:id/read-progress`, async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage, page } = z
      .object({
        percentage: z.number(),
        page: z.number(),
      })
      .parse(req.body);

    await BookRepo.chapters.updates.readProgress({
      chapterId: id,
      percentage,
      page,
    });
    return res.status(200).send({});
  } catch (err) {
    logger.error(err);
    return res.status(500).send();
  }
});
