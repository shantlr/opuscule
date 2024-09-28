import { useBook } from 'hooks/api/use-books';
import { MainLayout } from 'layouts/main-layout';
import { flatMap, groupBy, map } from 'lodash';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export const BookDetails = () => {
  const params = useParams<{ bookId: string }>();
  const { data } = useBook({
    id: params.bookId,
  });

  const chapters = useMemo(() => {
    const flattened = flatMap(data?.book?.sourceBooks, (sb) => sb.chapters);
    const grouped = groupBy(flattened, (c) => c.chapter_rank);
    return map(grouped, (g) => ({
      ...g[0],
      sources: g.map((c) => c.source_id),
    }));
  }, [data]);

  return (
    <MainLayout>
      <div className="p-2 h-full w-full">
        <ul className="h-full w-full overflow-auto">
          {chapters?.map((chapter) => (
            <li key={chapter.id}>
              <a href={`/book/${data?.book?.id}/chapter/${chapter.id}`}>
                Chapter {chapter.chapter_rank}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </MainLayout>
  );
};
