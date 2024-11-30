import { db } from 'data/db';
import {
  Chapter,
  SourceBook,
  UserBookState,
  UserChapterState,
} from 'data/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { chunk, flatMap, groupBy, reduce } from 'lodash';

export const UserStateRepo = {
  sync: {
    booksUnreadCount: async ({ bookIds }: { bookIds: string[] }) => {
      if (!bookIds.length) {
        return;
      }

      for (const bookIdBatch of chunk(bookIds, 10)) {
        const sourceBooks = await db.query.SourceBook.findMany({
          where: inArray(SourceBook.book_id, bookIdBatch),
        });

        const sourceBookByBookId = groupBy(sourceBooks, (sb) => sb.book_id);

        const unreadChapters = await db
          .select({
            id: Chapter.id,
            rank: Chapter.chapter_rank,
            source_book_id: Chapter.source_book_id,
            read: UserChapterState.read,
          })
          .from(Chapter)
          .where(
            and(
              inArray(
                Chapter.source_book_id,
                sourceBooks.map((sb) => sb.source_book_id),
              ),
            ),
          )
          .leftJoin(
            UserChapterState,
            and(eq(UserChapterState.chapter_id, Chapter.id)),
          );

        const chapterBySourceBookId = groupBy(
          unreadChapters,
          (c) => c.source_book_id,
        );

        for (const bookId of bookIdBatch) {
          const sourceBookIds =
            sourceBookByBookId[bookId]?.map((sb) => sb.source_book_id) ?? [];
          const chapters = flatMap(
            sourceBookIds,
            (sourceBookId) => chapterBySourceBookId[sourceBookId] || [],
          );
          const unreadCount = reduce(
            groupBy(chapters, (c) => c.rank),
            (acc, group) => acc + (group.every((c) => !c.read) ? 1 : 0),
            0,
          );
          await db
            .insert(UserBookState)
            .values({
              book_id: bookId,
              unread_count: unreadCount || 0,
            })
            .onConflictDoUpdate({
              set: {
                unread_count: unreadCount || 0,
              },
              target: [UserBookState.book_id],
            });
        }
      }
    },
    onBookChapterUpdated: async (arg: { bookId: string }) => {
      await UserStateRepo.sync.booksUnreadCount({ bookIds: [arg.bookId] });
    },
    onChapterReadDone: async ({ chapterId }: { chapterId: string }) => {
      const chapter = await db.query.Chapter.findFirst({
        columns: {},
        where: eq(Chapter.id, chapterId),
        with: {
          sourceBook: {
            columns: {
              book_id: true,
              source_book_id: true,
            },
          },
        },
      });
      if (chapter?.sourceBook?.book_id) {
        await UserStateRepo.sync.booksUnreadCount({
          bookIds: [chapter?.sourceBook.book_id],
        });
      }
    },
  },
};
