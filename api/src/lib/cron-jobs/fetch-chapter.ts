import { BookRepo } from 'data/repo/books-repo';
import { Sources, fetchBookChapter } from 'sources';

export const fetchChapter = async ({ chapterId }: { chapterId: string }) => {
  const chapter = await BookRepo.chapters.get.byId(chapterId);
  console.log(`[fetch-chapter] ${chapterId} started`);

  if (!chapter) {
    console.error(`Chapter not found: ${chapterId}`);
    return;
  }

  const source = Sources.find((s) => s.id === chapter.source_id);
  if (!source) {
    console.error(`Source not found: ${chapter.source_id}`);
    return;
  }

  await fetchBookChapter(source, chapter.source_book_id, chapter.chapter_id);
};
