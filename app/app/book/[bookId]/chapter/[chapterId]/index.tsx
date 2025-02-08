import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { findLastIndex } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTypedLocalSearchParams } from '@/common/navigation/use-local-search-params';
import { Button } from '@/common/ui/button';
import { Image } from '@/common/ui/image';
import {
  HEADER_HEIGHT,
  MobileScreenHeader,
} from '@/common/ui/layouts/mobile-screen-header';
import { useBookChapter, useSaveReadProgress } from '@/features/books/use-book';

const MAX_WIDTH = 650;

export default function ChapterScreen() {
  const { chapterId, bookId } = useTypedLocalSearchParams(
    '/book/[bookId]/chapter/[chapterId]',
  );
  const { data, isLoading } = useBookChapter({
    params: {
      bookId,
      chapterId,
    },
  });
  const { mutate: saveProgress } = useSaveReadProgress();
  const { replace } = useRouter();

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

  // const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
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

    if (!data.chapter?.user_state) {
      setProgressInited(true);
      return;
    }

    const { percentage } = data.chapter.user_state;

    const y = scrollHeight.contentHeight * percentage - scrollHeight.height;
    scrollViewRef.current?.scrollTo({
      y,
      animated: false,
    });
    setProgressInited(true);
  }, [
    data?.chapter?.pages,
    data?.chapter?.user_state,
    progressInited,
    scrollHeight,
  ]);

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

  const [showOverlay, setShowOverlay] = useState(false);

  const lastOffsetValue = useRef(0);
  const headerOffset = useSharedValue(45);

  const style = useAnimatedStyle(() => ({
    height: headerOffset.value,
    opacity: interpolate(headerOffset.value, [0, HEADER_HEIGHT], [0, 1]),
  }));

  return (
    <View
      className="h-full w-full"
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <Animated.View style={style}>
        <MobileScreenHeader
          back={{
            pathname: '/book/[bookId]',
            params: { bookId },
          }}
          title={
            isLoading ? 'Loading...' : `Chapter ${data?.chapter?.chapter_id}`
          }
        />
      </Animated.View>
      <Animated.ScrollView
        ref={scrollViewRef}
        className="w-full"
        // scrollEventThrottle={500}
        scrollEventThrottle={16}
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
          const deltaY =
            event.nativeEvent.contentOffset.y - (lastOffsetValue.current ?? 0);
          lastOffsetValue.current = event.nativeEvent.contentOffset.y;

          headerOffset.value = Math.max(
            Math.min(headerOffset.value - deltaY, HEADER_HEIGHT),
            0,
          );

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
        <Pressable
          onPress={() => {
            setShowOverlay((v) => !v);
          }}
        >
          {data?.chapter?.pages?.map((page, index) => (
            <View key={index}>
              <Image
                style={{
                  height:
                    page.height *
                    (Math.min(width ?? 0, MAX_WIDTH) / page.width),
                  width: '100%',
                }}
                contentFit="contain"
                source={page.url}
              />
            </View>
          ))}
        </Pressable>
      </Animated.ScrollView>
      {showOverlay && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <View className="bg-gray-600 w-full flex flex-row overflow-hidden flex-nowrap">
            <View className="w-full shrink grow"></View>
            <View className="shrink-0 flex flex-row p-2 gap-4">
              <Button
                disabled={!data?.previous_chapter_id}
                onPress={() => {
                  if (data?.previous_chapter_id) {
                    replace({
                      pathname: '/book/[bookId]/chapter/[chapterId]',
                      params: {
                        bookId,
                        chapterId: data.previous_chapter_id,
                      },
                    });
                  }
                }}
              >
                <AntDesign name="left" />
              </Button>
              <Button
                disabled={!data?.next_chapter_id}
                onPress={() => {
                  if (data?.next_chapter_id) {
                    replace({
                      pathname: '/book/[bookId]/chapter/[chapterId]',
                      params: {
                        bookId,
                        chapterId: data.next_chapter_id,
                      },
                    });
                  }
                }}
              >
                <AntDesign name="right" />
              </Button>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
