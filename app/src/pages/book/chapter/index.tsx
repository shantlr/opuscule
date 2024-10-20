import clsx from 'clsx';
import { ProgressBar } from 'components/display/progress-bar';
import { ApiChapterPage } from 'config/api/types';
import { useElementWidth } from 'hooks/dom/use-element-size';
import { useBookChapter } from 'hooks/api/use-books';
import { MainLayout } from 'layouts/main-layout';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const MAX_WIDTH = 750;
const MAX_WIDTH_CSS = `max-w-[750px]`;

const Page = ({
  page,
  containerWidth,
}: {
  page: ApiChapterPage;
  containerWidth: number;
}) => {
  const height = useMemo(() => {
    if (!containerWidth) {
      return 0;
    }

    const w = Math.min(containerWidth, MAX_WIDTH);

    const widthRatio = w / page.width;
    return page.height * widthRatio;
  }, [page, containerWidth]);

  if (!height) {
    return null;
  }

  return (
    <div
      className={clsx('w-full bg-cover shrink-0', MAX_WIDTH_CSS)}
      style={{
        backgroundImage: `url(${page.url})`,
        backgroundSize: '',
        height,
      }}
    />
  );
};

export const BookChapter = () => {
  const params = useParams<{ bookId: string; chapterId: string }>();
  const { data } = useBookChapter({
    bookId: params.bookId,
    chapterId: params.chapterId,
  });
  console.log({ data });
  const [elem, setElem] = useState<HTMLElement | null>(null);
  const containerWidth = useElementWidth(elem);
  const [readProgress, setReadProgress] = useState(0);

  return (
    <MainLayout>
      <div className="p-2 h-full w-full flex flex-col overflow-hidden">
        <div className="flex justify-center mb-2">
          <ProgressBar className="w-[300px]" percent={readProgress} />
        </div>
        <div
          ref={setElem}
          className="h-full w-full overflow-auto flex flex-col items-center"
          onScroll={(e) => {
            const percent =
              e.currentTarget.scrollTop / e.currentTarget.scrollHeight;
            console.log(
              percent,
              e.currentTarget.scrollTop,
              e.currentTarget.scrollHeight,
            );
            setReadProgress(percent);
          }}
        >
          {data?.chapter?.pages?.map((page, index) => (
            <Page key={index} page={page} containerWidth={containerWidth} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};
