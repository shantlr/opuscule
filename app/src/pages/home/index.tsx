import clsx from 'clsx';
import { Modal, ModalContent } from 'components/overlay/modal';
import { dayjs } from 'config/dayjs';
import { ContentBookDetails } from 'content/book-details';
import { useLastUpdatedBooks } from 'hooks/api/use-books';
import { useSources } from 'hooks/api/use-sources';
import { MainLayout } from 'layouts/main-layout';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

const LastBooks = () => {
  const { data } = useLastUpdatedBooks({});
  const [focusedBook, setFocusedBook] = useState<{
    open: boolean;
    book: NonNullable<typeof data>['books'][number];
    originElem: HTMLElement;
  } | null>(null);

  return (
    <>
      <Modal
        open={!!focusedBook?.open}
        trigger={focusedBook?.originElem}
        onClose={() => {
          setFocusedBook((b) =>
            b
              ? {
                  ...b,
                  open: false,
                }
              : null,
          );
        }}
      >
        <ModalContent>
          <ContentBookDetails bookId={focusedBook?.book.id} />
        </ModalContent>
      </Modal>
      <div className="w-full h-full overflow-auto flex flex-wrap gap-6 justify-center pt-8">
        {data?.books?.map((book) => (
          <div key={book.id}>
            <div
              className="w-[320px] p-2 transition-all hover:scale-110 hover:shadow-2xl rounded-2xl overflow-hidden flex bg-white"
              onClick={(e) => {
                setFocusedBook({
                  open: true,
                  book,
                  originElem: e.currentTarget as HTMLElement,
                });
              }}
            >
              {/* left part */}
              <div className="w-full p-1">
                <div className="text-black text-xs mb-4">{book.title}</div>
                <ul>
                  {book.latests_chapters.map((chapter) => (
                    <li className="mb-1" key={chapter.id}>
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
                role="button"
                className={clsx(
                  'w-[160px] shrink-0 h-[230px] rounded-xl shadow-slate-300 hover:shadow-slate-200 bg-slate-500 p-2 bg-cover',
                )}
                key={book.id}
                style={{
                  backgroundImage: `url(${book.cover_url})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const HomePage = () => {
  const { data: sources } = useSources({});

  if (!!sources && !sources.length) {
    return <Navigate to="/sources/subscribe" />;
  }

  return (
    <MainLayout>
      <LastBooks />
    </MainLayout>
  );
};
