import { defaultLogger, Logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { Sources, fetchBookChapter } from 'sources';

export const fetchChapter = async ({
  chapterId,
  force,
  logger = defaultLogger,
}: {
  chapterId: string;
  logger?: Logger;
  force?: boolean;
}) => {
  const log = logger.scope('fetch-chapter');
  const chapter = await BookRepo.chapters.get.byId(chapterId);
  log.info(`[fetch-chapter] ${chapterId} started`);

  if (!chapter) {
    log.error(`Chapter not found: ${chapterId}`);
    return;
  }

  const source = Sources.find((s) => s.id === chapter.source_id);
  if (!source) {
    log.error(`Source not found: ${chapter.source_id}`);
    return;
  }

  await fetchBookChapter(source, chapter.source_book_id, chapter.chapter_id, {
    force,
  });
};
