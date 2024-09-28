import clsx from 'clsx';
import { useLastUpdatedBooks } from 'hooks/api/use-books';
import { useSources } from 'hooks/api/use-sources';
import { MainLayout } from 'layouts/main-layout';
import { Navigate } from 'react-router-dom';

const LastBooks = () => {
  const { data } = useLastUpdatedBooks({});

  console.log({ data });

  return (
    <div className="w-full h-full overflow-auto flex flex-wrap gap-6 justify-center pt-8">
      {data?.books?.map((book) => (
        <a key={book.id} href={`/book/${book.id}`}>
          <div className="w-[160px] transition-all hover:scale-105 rounded overflow-hidden">
            <div
              role="button"
              className={clsx(
                'w-full h-[230px] shadow-slate-300 hover:shadow-slate-200 bg-slate-500 p-2 bg-cover',
              )}
              key={book.id}
              style={{
                backgroundImage: `url(${book.cover_url})`,
              }}
            ></div>
            <div className="bg-slate-900 h-full bg-opacity-80 p-1 rounded text-sm">
              {book.title}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export const HomePage = () => {
  const { data: sources } = useSources({});

  if (!!sources && !sources.length) {
    return <Navigate to="/sources/subscribe" />;
  }

  console.log(sources);
  return (
    <MainLayout>
      <LastBooks />
    </MainLayout>
  );
};
