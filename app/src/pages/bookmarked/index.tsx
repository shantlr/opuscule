import { BookItem } from 'components/domains/book-item';
import { useBookmarkedBooks } from 'hooks/api/use-books';
import { MainLayout } from 'layouts/main-layout';

export const BookmarkedPage = () => {
  const { data } = useBookmarkedBooks({});

  return (
    <MainLayout>
      <div className="w-full h-full overflow-auto pt-8">
        <ul className="w-full flex flex-wrap gap-6 justify-center">
          {data?.books?.map((book) => <BookItem key={book.id} book={book} />)}
        </ul>
      </div>
    </MainLayout>
  );
};
