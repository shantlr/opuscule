import clsx from 'clsx';
import { ApiBookSummary } from 'config/api/types';
import { dayjs } from 'config/dayjs';
import { useBookmarkBook, useUnbookmarkBook } from 'hooks/api/use-books';
import { Bookmark } from 'lucide-react';
import { MouseEvent } from 'react';

export const BookItem = ({
  book,
  onFocusBook,
}: {
  book: ApiBookSummary;
  onFocusBook: (e: MouseEvent) => void;
}) => {
  const bookmark = useBookmarkBook();
  const unbookmark = useUnbookmarkBook();

  return (
    <div key={book.id}>
      <div
        className="w-[320px] p-2 transition-all hover:scale-110 hover:shadow-2xl rounded-2xl overflow-hidden flex gap-1 bg-secondarybg cursor-pointer"
        onClick={(e) => {
          onFocusBook(e);
        }}
      >
        {/* left part */}
        <div className="w-full p-1">
          <div className="flex items-center text-black text-xs mb-4">
            <span className="text-base mr-1 cursor-pointer hover:text-red-400 transition-all">
              {book.bookmarked ? (
                <Bookmark
                  className="text-red-400 fill-red-400 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    unbookmark.mutate({ id: book.id });
                  }}
                />
              ) : (
                <Bookmark
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    bookmark.mutate({ id: book.id });
                  }}
                />
              )}
            </span>
            {book.title}
          </div>

          {/* Latests chapter list */}
          <ul>
            {book.latests_chapters.map((chapter) => (
              <li
                className="flex flex-col mb-1 rounded-xl hover:bg-mainbg px-2 py-1 transition-all cursor-pointer"
                key={chapter.id}
              >
                <a
                  className="text-sm"
                  href={`/book/${book.id}/chapter/${chapter.id}`}
                >
                  Chapter {chapter.chapter_id}
                </a>
                <div className="text-xs text-light">
                  {chapter.published_at
                    ? dayjs(chapter.published_at).fromNow()
                    : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* right cover */}
        <div
          className={clsx(
            'w-[160px] shrink-0 h-[230px] rounded-xl shadow-slate-300 hover:shadow-slate-200 bg-slate-500 p-2 bg-cover',
            'flex justify-end',
          )}
          key={book.id}
          style={{
            backgroundImage: `url(${book.cover_url})`,
          }}
        ></div>
      </div>
    </div>
  );
};
