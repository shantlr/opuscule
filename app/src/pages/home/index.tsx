import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Modal, ModalContent } from 'components/overlay/modal';
import { ContentBookDetails } from 'content/book-details';
import { useLastUpdatedBooks } from 'hooks/api/use-books';
import { useSources } from 'hooks/api/use-sources';
import { MainLayout } from 'layouts/main-layout';
import { BookItem } from 'components/domains/book-item';

const LastBooks = () => {
  const { data } = useLastUpdatedBooks({});
  const [focusedBook, setFocusedBook] = useState<{
    open: boolean;
    book: NonNullable<typeof data>['books'][number];
    originElem: HTMLElement;
  } | null>(null);
  const nav = useNavigate();

  const onCloseFocusedBook = () => {
    setFocusedBook((b) =>
      b
        ? {
            ...b,
            open: false,
          }
        : null,
    );
  };

  return (
    <>
      <Modal
        open={!!focusedBook?.open}
        trigger={focusedBook?.originElem}
        onClose={() => {
          onCloseFocusedBook();
        }}
      >
        <ModalContent
          className="w-[90svw] h-[90svh]"
          onClose={() => {
            onCloseFocusedBook();
          }}
          onExpand={() => {
            nav(`/book/${focusedBook?.book.id}`);
          }}
        >
          <ContentBookDetails bookId={focusedBook?.book.id} />
        </ModalContent>
      </Modal>
      <div className="w-full h-full overflow-auto p-4 px-8 flex flex-wrap gap-6 justify-center pt-8">
        {data?.books?.map((book) => (
          <BookItem
            key={book.id}
            book={book}
            onClick={(e) => {
              setFocusedBook({
                open: true,
                book,
                originElem: e.currentTarget as HTMLElement,
              });
            }}
          />
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
