import { Button } from 'components/interactions/button';
import { useBook, useBookRefetch } from 'hooks/api/use-books';
import { flatMap, groupBy, map, sortBy } from 'lodash';
import { useMemo } from 'react';
import { dayjs } from 'config/dayjs';
import { ButtonIcon } from 'components/interactions/button-icon';
import { RefreshCw } from 'lucide-react';

export const ContentBookDetails = ({ bookId }: { bookId?: string }) => {
  const { data } = useBook({
    id: bookId,
  });
  const refetchBook = useBookRefetch();

  const chapters = useMemo(() => {
    const flattened = flatMap(data?.book?.sourceBooks, (sb) => sb.chapters);
    const grouped = groupBy(flattened, (c) => c.chapter_rank);
    return sortBy(
      map(grouped, (g) => ({
        ...g[0],
        sources: g.map((c) => c.source_id),
      })),
      (c) => -c.chapter_rank,
    );
  }, [data]);

  return (
    <div className="flex flex-col p-2 h-full w-full overflow-auto">
      <div className="mb-8 flex">
        <div
          className="w-[200px] shrink-0 h-[300px] object-contain rounded-2xl bg-cover overflow-hidden mr-4"
          style={{
            backgroundImage: `url(${data?.book?.cover_url})`,
          }}
        />
        <div className="w-full">
          <h2>{data?.book?.title}</h2>
          <p>{data?.book?.description}</p>
        </div>
        <div>
          <ButtonIcon
            onClick={() => {
              refetchBook.mutate({
                id: bookId!,
              });
            }}
          >
            <RefreshCw />
          </ButtonIcon>
        </div>
      </div>
      <ul className="h-full w-full">
        {chapters?.map((chapter) => (
          <li key={chapter.id}>
            <a href={`/book/${data?.book?.id}/chapter/${chapter.id}`}>
              <span>Chapter {chapter.chapter_rank}</span>
              <span>
                -{' '}
                {chapter.published_at
                  ? dayjs(chapter.published_at).format('MMMM DD YYYY')
                  : ''}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
