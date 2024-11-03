import { Image } from 'expo-image';
import { findLastIndex } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useTypedLocalSearchParams } from '@/common/navigation/use-local-search-params';
import { MobileScreenHeader } from '@/common/ui/layouts/mobile-screen-header';
import {
  useBookChapter,
  useSaveReadProgress,
} from '@/features/books/hooks/use-books';

export default function ChapterScreen() {
  const { chapterId, bookId } = useTypedLocalSearchParams(
    '/book/[bookId]/chapter/[chapterId]',
  );
  const { data, isLoading } = useBookChapter({
    bookId,
    chapterId,
  });
  const { mutate: saveProgress } = useSaveReadProgress();

  const [width, setWidth] = useState<number | null>(null);

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

  const [progressInited, setProgressInited] = useState(false);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const [scrollHeight, setScrollHeight] = useState({
    height: 0,
    contentHeight: 0,
  });

  const endReachedRef = useRef(false);
  const [readProgress, setReadProgress] = useState<{
    percentage: number;
    page: number;
  }>({
    percentage: 0,
    page: 0,
  });

  // init progress
  useEffect(() => {
    if (
      progressInited ||
      !data?.chapter?.pages ||
      !scrollHeight?.contentHeight ||
      !scrollHeight.height
    ) {
      return;
    }
    if (!data.user_state) {
      setProgressInited(true);
      return;
    }

    const y =
      scrollHeight.contentHeight * data.user_state.percentage -
      scrollHeight.height;
    scrollViewRef.current?.scrollTo({
      y,
      animated: false,
    });
    setProgressInited(true);
  }, [data?.chapter?.pages, data?.user_state, progressInited, scrollHeight]);

  // save progress
  useEffect(() => {
    if (!readProgress?.percentage || !progressInited || endReachedRef.current) {
      return;
    }

    // directly save progress if end reached
    if (readProgress.percentage === 100) {
      endReachedRef.current = true;
      saveProgress({
        bookId: bookId,
        chapterId: chapterId,
        percentage: readProgress.percentage,
        page: readProgress.page,
      });
      return;
    }

    // debounce save progress
    const handle = setTimeout(() => {
      saveProgress({
        bookId: bookId,
        chapterId: chapterId,
        percentage: readProgress.percentage,
        page: readProgress.page,
      });
    }, 1 * 1000);
    return () => clearTimeout(handle);
  }, [readProgress.page, readProgress.percentage]);

  return (
    <View
      className="h-full w-full"
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <MobileScreenHeader
        back={{
          pathname: '/book/[bookId]',
          params: { bookId },
        }}
        title={
          isLoading ? 'Loading...' : `Chapter ${data?.chapter?.chapter_id}`
        }
      />
      <ScrollView
        ref={scrollViewRef}
        className="w-full"
        scrollEventThrottle={500}
        onLayout={(event) => {
          const height = event.nativeEvent?.layout?.height;
          setScrollHeight((v) => ({
            ...v,
            height,
          }));
        }}
        onContentSizeChange={(width, height) => {
          setScrollHeight((v) => ({
            ...v,
            contentHeight: height,
          }));
        }}
        onScroll={(event) => {
          // NOTE: percent as of the bottom of the page
          const currentOffset =
            event.nativeEvent.contentOffset.y +
            event.nativeEvent.layoutMeasurement.height;

          const scrollPercent =
            currentOffset / event.nativeEvent.contentSize.height;

          const currentPage = findLastIndex(
            pageOffsets,
            (pageOffset) => currentOffset >= pageOffset,
          );

          setReadProgress({
            percentage: scrollPercent,
            page: currentPage,
          });
        }}
      >
        {data?.chapter?.pages?.map((page, index) => (
          <View key={index}>
            <Image
              className="w-full"
              style={{
                height: page.height * (Math.min(width ?? 0, 500) / page.width),
              }}
              contentFit="contain"
              source={page.url}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
