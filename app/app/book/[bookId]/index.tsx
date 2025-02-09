import clsx from 'clsx';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import { ApiBookDetail } from '@/common/api/types';
import { dayjs } from '@/common/dayjs';
import { useIsMobile } from '@/common/hooks/use-screen-size';
import { useTypedLocalSearchParams } from '@/common/navigation/use-local-search-params';
import { Button } from '@/common/ui/button';
import { Checkbox } from '@/common/ui/checkbox';
import { Image } from '@/common/ui/image';
import { BackNav } from '@/common/ui/layouts/back-nav';
import { MobileScreenHeader } from '@/common/ui/layouts/mobile-screen-header';
import {
  useBook,
  useBookmarkBook,
  useUnbookmarkBook,
} from '@/features/books/use-book';
import { useUpdateManyChapterReadProgress } from '@/features/chapter/hooks';
import { useSources } from '@/features/sources/hooks/use-sources';

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

function MobileScreen({
  bookId,
  data,
}: {
  bookId: string;
  data: ReturnType<typeof useBook>['data'];
}) {
  const { mutate: bookmark } = useBookmarkBook({});
  const { mutate: unbookmark } = useUnbookmarkBook({});

  const dimensions = useWindowDimensions();

  // const BG_HEIGHT = dimensions.height * 0.5;
  const HEADER_HEIGHT = 400;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const cardHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: Math.max(40, 340 - scrollOffset.value),
        },
      ],
    };
  });

  return (
    <View className="h-full relative">
      <Animated.View
        className="absolute w-full top-0 left-0"
        sharedTransitionTag={`book-cover-${bookId}`}
      >
        <Image
          cachePolicy="disk"
          source={data?.book?.cover_url}
          style={{
            height: HEADER_HEIGHT,
            width: '100%',
          }}
        />
      </Animated.View>
      <View className="absolute top-0 left-0">
        <BackNav href="/" className="text-white" />
      </View>
      <Animated.View className="" style={[cardHeaderStyle]}>
        <View className="bg-mainbg rounded-t-3xl pt-2 pb-2">
          <Text className="text-lg text-center">{data?.book?.title}</Text>
        </View>
      </Animated.View>
      <Animated.ScrollView
        style={{
          marginTop: 80,
          height: dimensions.height - 80,
        }}
        className="absolute w-full"
        ref={scrollRef}
        scrollEventThrottle={16}
      >
        <View className="h-[300px] w-full"></View>
        <View className="h-full bg-mainbg pt-4">
          <View className="px-4">
            <ChapterList book={data?.book} />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

export default function BookDetailsScreen() {
  const { bookId } = useTypedLocalSearchParams('/book/[bookId]');
  const { data: sources } = useSources();
  const { data, error } = useBook({
    params: {
      id: bookId,
    },
  });

  const bookSources = useMemo(() => {
    return (
      data?.book?.source_ids
        .map((id) => sources?.find((source) => source.id === id))
        .filter((v) => v != null) ?? []
    );
  }, [data, sources]);

  console.log({ bookSources });

  const [mode, setMode] = useState<'mark-read' | 'mark-unread' | null>(null);
  const { mutate: updateManyChapterReadProgress } =
    useUpdateManyChapterReadProgress();

  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileScreen bookId={bookId} data={data} />;
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
            <View className="mt-8">
              {bookSources.map((source) => (
                <View key={source.id}>
                  {source?.logo_url ? (
                    <Image
                      source={source.logo_url}
                      className="w-[36px] h-[36px]"
                    />
                  ) : (
                    <View />
                  )}
                </View>
              ))}
            </View>
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
