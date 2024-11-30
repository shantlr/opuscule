import { View } from 'react-native';

import { ApiBookSummary } from '@/common/api/types';

import { BookCard } from '../ui-book-card';

export const BooksCarousel = ({ books }: { books: ApiBookSummary[] }) => {
  return (
    <View className="w-full overflow-hidden px-2">
      <View
        role="list"
        className="flex w-full flex-row overflow-auto gap-4 px-2 pt-4"
      >
        {books.map((book) => (
          <BookCard key={book.id} size="small" book={book} />
        ))}
      </View>
    </View>
  );
};
