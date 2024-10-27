import { defaultLogger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { SourceRepo } from 'data/repo/source';
import { Sources, fetchBookDetails } from 'sources';

export const fetchBook = async (bookId: string, logger = defaultLogger) => {
  const sourceBooks = await SourceRepo.books.get.subscribedSourceOfBook(bookId);
  logger
    .scope('fetch-book')
    .info(
      `[fetch-book] ${bookId} sources:`,
      sourceBooks.map((s) => s.source_id).join(', '),
    );

  for (const sourceBook of sourceBooks) {
    const source = Sources.find((s) => s.id === sourceBook.source_id);
    if (!source) {
      logger.error(
        `[fetch-book] source '${sourceBook.source_id}' not found for book '${bookId}'`,
      );
      continue;
    }

    await fetchBookDetails(source, sourceBook.source_book_id);
  }
  await BookRepo.update.lastDetailsFetched(bookId, new Date());
  logger.scope('fetch-book').info(`${bookId} done`);
};
