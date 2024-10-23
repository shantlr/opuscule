import { Router } from 'express';

import { Sources, fetchSourceLatests } from '../sources';
import { SourceRepo } from '../data/repo/source';
import { z } from 'zod';
import { BookRepo } from 'data/repo/books-repo';
import { fetchBook } from 'lib/cron-jobs/fetch-book';
import { fetchChapter } from 'lib/cron-jobs/fetch-chapter';
import dayjs from 'dayjs';
import { keyBy, omit, sortBy } from 'lodash';

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
    console.error(err);
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
    console.log(`[fetch-source-latests] ${source.id} started (from=subscribe)`);
    void fetchSourceLatests(source!).catch((err) => {
      console.error(
        `[fetch-source-latests] ${source!.id} failed (from=subscribe)`,
        err,
      );
    });

    return res.status(200).send({
      success: true,
    });
  } catch (err) {
    console.error(err);
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
    console.log(err);
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

    const mappedBooks = books.map((book) => {
      const chapters = book.sourceBooks.flatMap((sb) => sb.chapters);
      return {
        ...book,
        bookmarked: stateByBookId[book.id]?.bookmarked ?? false,
        latests_chapters: sortBy(chapters, (c) => -c.chapter_rank).slice(0, 3),
      };
    });

    return res.status(200).send({
      books: mappedBooks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});
router.get('/books/:id', async (req, res) => {
  try {
    const book = await BookRepo.get.byIdWithChapters(req.params.id);
    if (!book) {
      return res.status(404).send();
    }

    // if details never fetched, fetch it
    if (!book.last_detail_updated_at) {
      await fetchBook(book.id);
      const updated = await BookRepo.get.byIdWithChapters(book.id);
      return res.status(200).send({
        book: updated,
      });
    }

    return res.status(200).send({
      book,
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    return res.status(500).send();
  }
});

router.get('/books/:bookId/chapter/:chapterId', async (req, res) => {
  try {
    const chapter = await BookRepo.chapters.get.byIdWithReadProgress(
      req.params.chapterId,
    );

    if (!chapter) {
      return res.status(404).send();
    }

    if (!chapter.pages) {
      await fetchChapter({
        chapterId: chapter.id,
      });
      const updated = await BookRepo.chapters.get.byId(chapter.id);
      return res.status(200).send({
        chapter: updated,
      });
    }

    return res.status(200).send({
      chapter: omit(chapter, 'userState'),
      user_state: chapter.userState,
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    return res.status(500).send();
  }
});
