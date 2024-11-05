import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';

import { ApiBookSummary } from '@/common/api/types';
import { dayjs } from '@/common/dayjs';
import { LinkPressable } from '@/common/ui/link-pressable';

import { useBookmarkBook, useUnbookmarkBook } from '../../hooks/use-books';

export const BookCard = ({
  book,
  size = 'default',
}: {
  book: ApiBookSummary;
  size?: 'small' | 'default';
}) => {
  const { mutate: bookmark } = useBookmarkBook({});
  const { mutate: unbookmark } = useUnbookmarkBook({});

  if (size === 'small') {
    return (
      <LinkPressable
        href={{
          pathname: '/book/[bookId]',
          params: { bookId: book.id },
        }}
        className="w-[115px] mb-8 overflow-hidden web:hover:scale-105 transition-all"
      >
        <View className="relative rounded-xl w-full overflow-hidden h-[180px]">
          <Image
            source={book.cover_url}
            cachePolicy="disk"
            style={{
              height: 180,
            }}
          />
          <TouchableOpacity
            className="absolute top-2 right-2 rounded-xl shadow-xl p-1 bg-black/30"
            onPress={(event) => {
              event.stopPropagation?.();
              event.preventDefault?.();
              if (book.bookmarked) {
                unbookmark({ id: book.id });
              } else {
                bookmark({ id: book.id });
              }
            }}
          >
            <Ionicons
              size={24}
              name={book?.bookmarked ? 'bookmark' : 'bookmark-outline'}
              className="text-white"
            />
          </TouchableOpacity>
        </View>
        <View className="h-[40px] mt-2 w-full">
          <Text className="line-clamp-2">{book.title}</Text>
        </View>
        <View>
          <Text className="text-light">
            Chapter {book.latests_chapters[0]?.chapter_id}
          </Text>
        </View>
      </LinkPressable>
    );
  }

  return (
    <LinkPressable
      href={{
        pathname: '/book/[bookId]',
        params: { bookId: book.id },
      }}
      className={clsx(
        'flex flex-row w-[320px] overflow-hidden p-2 bg-secondarybg rounded-xl cursor-pointer',
        'gap-2',
        'transition-all',
        'web:hover:scale-105',
      )}
    >
      <View className="shrink grow w-[320px]">
        <Text className="font-bold pl-2 pt-2 mb-2">{book.title}</Text>
        <View className="flex flex-col">
          {book.latests_chapters.map((chapter) => (
            <View
              className="p-2 hover:bg-mainbg rounded transition-all"
              key={chapter.id}
            >
              <Text className="">Chapter {chapter.chapter_id}</Text>
              <Text className="text-light">
                {chapter.published_at
                  ? dayjs(chapter.published_at).fromNow()
                  : null}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View>
        <View className="rounded-xl overflow-hidden">
          <Image
            source={book.cover_url}
            style={{
              width: 160,
              height: 230,
            }}
          />
        </View>
      </View>
    </LinkPressable>
  );
};
