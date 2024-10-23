import clsx from 'clsx';
import { ProgressBar } from 'components/display/progress-bar';
import { ApiChapterPage } from 'config/api/types';
import { useElementWidth } from 'hooks/dom/use-element-size';
import { useBookChapter, useSaveReadProgress } from 'hooks/api/use-books';
import { MainLayout } from 'layouts/main-layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { findLastIndex } from 'lodash';

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
  const { mutate } = useSaveReadProgress();

  const [elem, setElem] = useState<HTMLElement | null>(null);
  const containerWidth = useElementWidth(elem);
  const [progressInited, setProgressInited] = useState(false);
  const [readProgress, setReadProgress] = useState<{
    percentage: number;
    page: number;
  }>({
    percentage: 0,
    page: 0,
  });
  const endReachedRef = useRef(false);

  const pageOffsets = useMemo(() => {
    if (!data?.chapter?.pages?.length) {
      return [];
    }
    const res: number[] = [];
    let offset = 0;
    for (const page of data.chapter.pages) {
      res.push(offset);
      offset += page.height;
    }
    return res;
  }, [data?.chapter?.pages]);

  // init progress
  useEffect(() => {
    if (progressInited || !data?.chapter?.pages || !elem) {
      return;
    }
    if (!data?.user_state) {
      setProgressInited(true);
      return;
    }

    elem.scrollTo({
      top: elem.scrollHeight * data.user_state.percentage - elem.clientHeight,
    });
    setProgressInited(true);
  }, [data?.chapter?.pages, data?.user_state, elem, progressInited]);

  useEffect(() => {
    if (!progressInited || !readProgress?.percentage || endReachedRef.current) {
      return;
    }

    // directly save progress if end reached
    if (readProgress.percentage === 100) {
      endReachedRef.current = true;
      mutate({
        chapterId: params.chapterId!,
        percentage: readProgress.percentage,
        page: readProgress.page,
      });
      return;
    }

    // debounce save progress
    const handle = setTimeout(() => {
      mutate({
        chapterId: params.chapterId!,
        percentage: readProgress.percentage,
        page: readProgress.page,
      });
    }, 1 * 1000);
    return () => clearTimeout(handle);
  }, [
    mutate,
    params.chapterId,
    progressInited,
    readProgress.page,
    readProgress.percentage,
  ]);

  return (
    <MainLayout>
      <div className="p-2 h-full w-full flex flex-col overflow-hidden">
        <div className="flex justify-center mb-2">
          <ProgressBar
            className="w-[300px]"
            percent={readProgress.percentage}
          />
        </div>
        <div
          ref={setElem}
          className="h-full w-full overflow-auto flex flex-col items-center"
          onScroll={(e) => {
            const percent =
              (e.currentTarget.scrollTop + (elem?.clientHeight ?? 0)) /
              e.currentTarget.scrollHeight;

            const currentPage = findLastIndex(
              pageOffsets,
              (pageOffset) => e.currentTarget.scrollTop >= pageOffset,
            );

            setReadProgress({
              percentage: percent,
              page: (currentPage ?? 0) >= 0 ? (currentPage ?? 0) : 0,
            });
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
