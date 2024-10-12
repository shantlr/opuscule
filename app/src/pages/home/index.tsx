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
          <div className="w-[320px] p-2 transition-all hover:scale-110 hover:shadow-2xl rounded-2xl overflow-hidden flex bg-white">
            <div className="w-full p-1">
              <div className="text-black text-xs">{book.title}</div>
            </div>
            <div
              role="button"
              className={clsx(
                'w-[160px] shrink-0 h-[230px] rounded-xl shadow-slate-300 hover:shadow-slate-200 bg-slate-500 p-2 bg-cover',
              )}
              key={book.id}
              style={{
                backgroundImage: `url(${book.cover_url})`,
              }}
            ></div>
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
