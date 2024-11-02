import { Link } from 'expo-router';
import { flatMap, groupBy, map, sortBy } from 'lodash';
import { useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ApiBookDetail } from '@/common/api/types';
import { dayjs } from '@/common/dayjs';
import { useIsMobile } from '@/common/hooks/use-screen-size';
import { useTypedLocalSearchParams } from '@/common/navigation/use-local-search-params';
import { MobileScreenHeader } from '@/common/ui/layouts/mobile-screen-header';
import { useBook } from '@/features/books/hooks/use-books';

const ChapterList = ({ book }: { book: ApiBookDetail | undefined }) => {
  const chapters = useMemo(() => {
    const flattened = flatMap(book?.sourceBooks, (sb) => sb.chapters);
    const grouped = groupBy(flattened, (c) => c.chapter_rank);
    return sortBy(
      map(grouped, (g) => ({
        ...g[0],
        sources: g.map((c) => c.source_id),
      })),
      (c) => -c.chapter_rank,
    );
  }, [book]);

  return (
    <View role="list" className="gap-1">
      {chapters?.map((chapter) => (
        <View key={chapter.id} role="listitem">
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
            <TouchableOpacity className="p-2">
              <Text className="web:hover:text-light transition-all">
                Chapter {chapter.chapter_id}
                <Text>
                  {' '}
                  -{' '}
                  {chapter.published_at
                    ? dayjs(chapter.published_at).fromNow()
                    : null}
                </Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      ))}
    </View>
  );
};

export default function BookDetailsScreen() {
  const { bookId } = useTypedLocalSearchParams('/book/[bookId]');
  const { data, error } = useBook({ id: bookId });

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <View className="h-full w-full">
        <MobileScreenHeader
          back={{
            pathname: '/',
          }}
          title={data?.book?.title ?? 'Loading...'}
        />
        <ScrollView>
          <View>
            <View className="w-full p-8">
              <Image
                className="w-full shrink-0 h-[400px] object- overflow-hidden mr-4 rounded-3xl"
                source={{
                  uri: data?.book?.cover_url ?? '',
                }}
              />
            </View>
            <Text>{data?.book?.description}</Text>
          </View>
          <ChapterList book={data?.book} />
        </ScrollView>
      </View>
    );
  }

  return (
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
          source={{
            uri: data?.book?.cover_url ?? '',
          }}
        />
        <View className="w-full shrink">
          <Text>{data?.book?.title}</Text>
          <Text>{data?.book?.description}</Text>
        </View>
      </View>
      <ChapterList book={data?.book} />
    </ScrollView>
  );
}
