import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiBookDetail } from '@/common/api/types';
import { dayjs } from '@/common/dayjs';
import { useIsMobile } from '@/common/hooks/use-screen-size';
import { useTypedLocalSearchParams } from '@/common/navigation/use-local-search-params';
import { Button } from '@/common/ui/button';
import { Checkbox } from '@/common/ui/checkbox';
import { Image } from '@/common/ui/image';
import { BackNav } from '@/common/ui/layouts/back-nav';
import {
  HEADER_HEIGHT,
  MobileScreenHeader,
} from '@/common/ui/layouts/mobile-screen-header';
import {
  useBook,
  useBookmarkBook,
  useUnbookmarkBook,
} from '@/features/books/use-book';
import { useUpdateManyChapterReadProgress } from '@/features/chapter/hooks';

const ChapterList = ({
  book,
  mode,
  onSubmitSelection,
}: {
  mode: 'mark-read' | 'mark-unread' | null;
  book: ApiBookDetail | undefined;
  onSubmitSelection: (chapterIds: string[]) => void;
}) => {
  const [checked, setChecked] = useState<Record<string, boolean> | null>(null);
  const [allChecked, setAllChecked] = useState(false);

  useEffect(() => {
    if (!mode) {
      setChecked(null);
      setAllChecked(false);
    }
  }, [mode]);

  return (
    <View role="list" className="gap-1">
      {!!mode && (
        <View className="flex flex-row items-center justify-between gap-2">
          <Checkbox
            checked={!!allChecked}
            onChange={(value) => setAllChecked(value)}
          >
            <Text>Select all</Text>
          </Checkbox>
          <Button
            variant="accent"
            size="s"
            onPress={() => {
              if (!book?.chapters?.length) {
                return;
              }

              if (allChecked) {
                onSubmitSelection?.(
                  book.chapters
                    .filter((c) => {
                      if (mode === 'mark-read') {
                        return !c.user_state?.read;
                      }
                      return !!c.user_state?.read;
                    })
                    .map((c) => c.id),
                );
              } else if (checked) {
                onSubmitSelection?.(
                  Object.keys(checked).filter((k) => checked[k]),
                );
              }
            }}
          >
            Confirm
          </Button>
        </View>
      )}
      {book?.chapters?.map((chapter) => (
        <View
          key={chapter.id}
          role="listitem"
          className="flex flex-row w-full gap-2"
        >
          {mode === 'mark-read' && (
            <Checkbox
              className={clsx({
                'opacity-0 pointer-events-none': chapter.user_state?.read,
              })}
              checked={(allChecked || checked?.[chapter.id]) ?? false}
              onChange={(v) => {
                setChecked((prev) => ({
                  ...prev,
                  [chapter.id]: v,
                }));
              }}
            />
          )}
          <Link
            href={{
              pathname: '/book/[bookId]/chapter/[chapterId]',
              params: {
                bookId: book!.id,
                chapterId: chapter.id,
              },
            }}
            asChild
          >
            <TouchableOpacity className="min-h-input-default p-3 bg-secondarybg rounded-lg flex flex-row items-center justify-between grow">
              <Text
                className={clsx('web:hover:text-light transition-all', {
                  'text-light': chapter.user_state?.read,
                })}
              >
                Chapter {chapter.chapter_id}
                <Text>
                  {' '}
                  -{' '}
                  {chapter.published_at
                    ? dayjs(chapter.published_at).fromNow()
                    : null}
                </Text>
              </Text>
              {!!chapter.user_state?.read_at && (
                <Text className="text-light">
                  {dayjs(chapter.user_state.read_at).fromNow()}
                </Text>
              )}
              {!!chapter.user_state && !chapter.user_state.read && (
                <View className="px-2 bg-accent rounded">
                  <Text className="text-sm text-on-accent">
                    {Math.round(chapter.user_state.percentage * 100)}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Link>
        </View>
      ))}
    </View>
  );
};

function MobileScreen({ data }: { data: ReturnType<typeof useBook>['data'] }) {
  const { mutate: bookmark } = useBookmarkBook({});
  const { mutate: unbookmark } = useUnbookmarkBook({});

  const safeArea = useSafeAreaInsets();
  const cardScrollView = useRef<ScrollView>(null);
  const contentScrollView = useRef<ScrollView>(null);

  const dimensions = useWindowDimensions();

  const BG_HEIGHT = dimensions.height * 0.5;

  const [cardBottomReached, setCardBottomReached] = useState(false);
  const [contentTopReached, setContentTopReached] = useState(true);

  const SCROLL_MARGIN_TOP = HEADER_HEIGHT + safeArea.top + 10;

  const titleTransition = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(titleTransition.value, [0, 24], [0, 1]),
  }));

  return (
    <View className="h-full w-full relative">
      <View
        className={clsx(
          'absolute w-full flex justify-center items-center overflow-hidden',
        )}
      >
        <Image
          cachePolicy="disk"
          source={data?.book?.cover_url}
          style={{
            height: BG_HEIGHT,
            width: '100%',
          }}
        />
        {/* Background */}
        <View className="absolute top-0 left-0 h-full w-full bg-gradient-to-b to-40% from-black/80 to-black/20"></View>

        {/* Header */}
        <Animated.View
          className="absolute w-full left-0 flex justify-center items-center"
          style={[
            {
              height: HEADER_HEIGHT,
              top: safeArea.top,
            },
            animatedStyle,
          ]}
        >
          <Text className="text-white line-clamp-1 text-lg">
            {data?.book?.title}
          </Text>
        </Animated.View>
        <View
          className="w-full absolute flex flex-row justify-between items-center"
          style={{
            top: safeArea.top,
            height: HEADER_HEIGHT,
            left: 0,
          }}
        >
          <BackNav href="/" className="text-white" />
          <TouchableOpacity
            onPress={() => {
              if (!data?.book) {
                return;
              }

              if (data.book.bookmarked) {
                unbookmark({ id: data.book.id });
              } else {
                bookmark({ id: data.book.id });
              }
            }}
          >
            <Ionicons
              size={24}
              name={data?.book?.bookmarked ? 'bookmark' : 'bookmark-outline'}
              className="text-white pr-2"
            />
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-[150px] right-8">
          <Button>START</Button>
        </View>
      </View>

      {/* Bottom sheet */}
      <ScrollView
        ref={contentScrollView}
        className="relative"
        style={{ marginTop: SCROLL_MARGIN_TOP }}
        scrollEventThrottle={16}
        scrollEnabled={!cardBottomReached || contentTopReached}
        bounces={false}
        onScroll={(event) => {
          if (
            event.nativeEvent.contentOffset.y +
              event.nativeEvent.layoutMeasurement.height >=
            event.nativeEvent.contentSize.height - 1
          ) {
            setCardBottomReached(true);
          } else {
            setCardBottomReached(false);
          }
        }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: BG_HEIGHT * 0.75 - SCROLL_MARGIN_TOP }} />
        <View
          className="p-8 pb-0 px-4 rounded-t-[40px] bg-mainbg shadow-xl"
          style={{
            height: dimensions.height - SCROLL_MARGIN_TOP,
          }}
        >
          <ScrollView
            ref={cardScrollView}
            scrollEnabled={cardBottomReached}
            scrollEventThrottle={1}
            className="rounded-t-xl pb-8"
            onScroll={(event) => {
              const y = event.nativeEvent.contentOffset.y;
              if (y <= 24) {
                titleTransition.value = y;
              } else {
                titleTransition.value = 24;
              }

              if (event.nativeEvent.contentOffset.y <= 0) {
                setContentTopReached(true);
              } else {
                setContentTopReached(false);
              }
            }}
          >
            <Text className="px-2 text-lg font-bold mb-4 text-center">
              {data?.book?.title}
            </Text>
            <ChapterList book={data?.book} />
            <View
              style={{
                height: safeArea.bottom,
              }}
            />
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

export default function BookDetailsScreen() {
  const { bookId } = useTypedLocalSearchParams('/book/[bookId]');
  const { data, error } = useBook({ id: bookId });

  const [mode, setMode] = useState<'mark-read' | 'mark-unread' | null>(null);
  const { mutate: updateManyChapterReadProgress } =
    useUpdateManyChapterReadProgress();

  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileScreen data={data} />;
  }

  return (
    <ScrollView>
      <MobileScreenHeader
        back={{
          pathname: '/',
        }}
        title={data?.book?.title ?? ''}
      />
      <ScrollView className="p-2 flex flex-col h-full w-full overflow-auto">
        {!!error && (
          <View>
            <Text>
              Something failed:{' '}
              {error instanceof Error ? error.message : String(error)}
            </Text>
          </View>
        )}
        <View className="w-full mb-8 flex flex-row overflow-hidden">
          <Image
            className="w-[200px] shrink-0 h-[300px] object-contain rounded-2xl bg-cover overflow-hidden mr-4"
            cachePolicy="disk"
            source={data?.book?.cover_url}
          />
          <View className="w-full shrink">
            <Text>{data?.book?.title}</Text>
            <Text>{data?.book?.description}</Text>
          </View>
        </View>
        <View className="flex flex-row w-full overflow-hidden flex-wrap pb-2 gap-1">
          <Button
            size="xs"
            variant={mode === 'mark-read' ? 'accent' : 'accent-outline'}
            onPress={() => {
              setMode(mode === 'mark-read' ? null : 'mark-read');
            }}
          >
            Mark as read
          </Button>
          <Button
            size="xs"
            variant={mode === 'mark-unread' ? 'accent' : 'accent-outline'}
            onPress={() => {
              setMode(mode === 'mark-unread' ? null : 'mark-unread');
            }}
          >
            Mark as unread
          </Button>
        </View>
        <ChapterList
          mode={mode}
          book={data?.book}
          onSubmitSelection={(chapterIds) => {
            if (mode === 'mark-read') {
              updateManyChapterReadProgress({
                bookId,
                chapters: chapterIds.map((id) => ({
                  id,
                  read: true,
                })),
              });
            } else if (mode === 'mark-unread') {
              updateManyChapterReadProgress({
                bookId,
                chapters: chapterIds.map((id) => ({
                  id,
                  read: false,
                })),
              });
            }
            setMode(null);
          }}
        />
      </ScrollView>
    </ScrollView>
  );
}
