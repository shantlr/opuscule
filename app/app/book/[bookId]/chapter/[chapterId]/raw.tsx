import pretty from 'pretty';

import { useTypedLocalSearchParams } from '@/common/navigation/use-local-search-params';
import { useChapterSourceRaw } from '@/features/chapter/hooks';

export default function ChapterRaw() {
  const { bookId, chapterId } = useTypedLocalSearchParams(
    '/book/[bookId]/chapter/[chapterId]/raw',
  );
  const { data } = useChapterSourceRaw({ id: chapterId, bookId });

  console.log(data);
  if (!data?.content) {
    return null;
  }

  const test = pretty(data.content);

  return (
    <div className="h-full w-full overflow-auto whitespace-pre-wrap text-sm">
      {test}
    </div>
  );
}
