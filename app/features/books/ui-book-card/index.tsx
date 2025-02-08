import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { ApiBookSummary } from '@/common/api/types';
import { dayjs } from '@/common/dayjs';
import { Image } from '@/common/ui/image';
import { LinkPressable } from '@/common/ui/link-pressable';

import { useBookmarkBook, useUnbookmarkBook } from '../use-book';

export const BookCard = ({
  book,
  size = 'default',
}: {
  book: ApiBookSummary;
  size?: 'small' | 'default';
}) => {
  const { mutate: bookmark, isLoading: isBookmarking } = useBookmarkBook({});
  const { mutate: unbookmark, isLoading: isUnbookmarking } = useUnbookmarkBook(
    {},
  );

  if (size === 'small') {
    return (
      <LinkPressable
        href={{
          pathname: '/book/[bookId]',
          params: { bookId: book.id },
        }}
        className="w-[115px] mb-8 web:hover:scale-105 transition-all"
      >
        <View className="relative rounded-xl w-full overflow-hidden h-[180px] shadow-md">
          <Image
            source={book.cover_url}
            cachePolicy="disk"
            style={{
              height: 180,
            }}
          />
          <TouchableOpacity
            className="absolute top-2 right-2 rounded-xl shadow-md shadow-accent p-1 bg-black/50"
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
            {!!book.bookmarked && (
              <View className="mr-1 text-accent border border-accent rounded px-1">
                <Text>{book.unread_chapters_count}</Text>
              </View>
            )}
            Chapter {book.latests_chapters[0]?.chapter_id}
          </Text>
          <Text className="text-sm text-light">
            {book.last_chapter_updated_at
              ? dayjs(book.last_chapter_updated_at).fromNow()
              : null}
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
        'flex flex-row w-[320px] min-w-[320px] overflow-hidden p-2 rounded-xl cursor-pointer',
        {
          'bg-secondarybg': !book.bookmarked,
          'bg-accent': !!book.bookmarked,
        },
        'gap-2',
        'transition-all',
        'web:hover:scale-105',
      )}
    >
      {/* Left part */}
      <View className="shrink grow">
        <Text className="font-bold pl-2 pt-2 mb-2 line-clamp-2">
          {!!book.bookmarked && (
            <View className="mr-1 text-white border border-white rounded px-1">
              <Text>{book.unread_chapters_count}</Text>
            </View>
          )}
          {book.title}
        </Text>
        <View className="flex flex-col">
          {book.latests_chapters.map((chapter) => (
            <View
              className="p-2 hover:bg-mainbg group rounded transition-all"
              key={chapter.id}
            >
              <Text className="line-clamp-2">Chapter {chapter.chapter_id}</Text>
              <Text
                className={clsx('line-clamp-2', {
                  'text-light': !book.bookmarked,
                  'text-white': !!book.bookmarked,
                  'group-hover:text-light': book.bookmarked,
                })}
              >
                {chapter.published_at
                  ? dayjs(chapter.published_at).fromNow()
                  : null}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Right part */}
      <View>
        <View className="shrink-0 relative rounded-xl overflow-hidden">
          <Image
            source={book.cover_url}
            cachePolicy="disk"
            style={{
              width: 160,
              height: 230,
            }}
          />
          {/* Bookmark */}
          <TouchableOpacity
            className="absolute top-2 right-2 rounded-xl shadow-md shadow-accent p-1 bg-black/50"
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
            {isBookmarking || isUnbookmarking ? (
              <ActivityIndicator />
            ) : (
              <Ionicons
                size={24}
                name={book?.bookmarked ? 'bookmark' : 'bookmark-outline'}
                className="text-white"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinkPressable>
  );
};
