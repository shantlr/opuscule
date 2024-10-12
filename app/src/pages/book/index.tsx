import { MainLayout } from 'layouts/main-layout';
import { ContentBookDetails } from 'content/book-details';
import { useParams } from 'react-router-dom';

export const BookDetails = () => {
  const params = useParams<{ bookId: string }>();

  return (
    <MainLayout>
      <ContentBookDetails bookId={params.bookId!} />
    </MainLayout>
  );
};
