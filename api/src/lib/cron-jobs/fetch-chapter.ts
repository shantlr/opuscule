import { defaultLogger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { Logger } from 'pino';
import { Sources, fetchBookChapter } from 'sources';

export const fetchChapter = async ({
  chapterId,
  logger = defaultLogger,
}: {
  chapterId: string;
  logger?: Logger;
}) => {
  const chapter = await BookRepo.chapters.get.byId(chapterId);
  logger.info(`[fetch-chapter] ${chapterId} started`);

  if (!chapter) {
    logger.error(`Chapter not found: ${chapterId}`);
    return;
  }

  const source = Sources.find((s) => s.id === chapter.source_id);
  if (!source) {
    logger.error(`Source not found: ${chapter.source_id}`);
    return;
  }

  await fetchBookChapter(source, chapter.source_book_id, chapter.chapter_id);
};
