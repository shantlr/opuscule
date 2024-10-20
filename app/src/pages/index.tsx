import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HomePage } from './home';
import { SourcesSubscribe } from './sources/subscribe';
import { BookDetails } from './book';
import { BookChapter } from './book/chapter';
import { PageNotFound } from './404';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/sources/subscribe',
    element: <SourcesSubscribe />,
  },
  {
    path: '/book/:bookId',
    element: <BookDetails />,
  },
  {
    path: '/book/:bookId/chapter/:chapterId',
    element: <BookChapter />,
  },
  {
    path: '*',
    element: <PageNotFound />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
