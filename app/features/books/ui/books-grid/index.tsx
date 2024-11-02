import { useState } from 'react';
import { View } from 'react-native';

import { ApiBookSummary } from '@/common/api/types';

import { BookCard } from '../book-card';

export const BooksGrid = ({
  books,
}: {
  books: ApiBookSummary[] | undefined;
}) => {
  const [width, setWidth] = useState<number | null>(null);

  return (
    <View
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
      className="py-8 w-full flex flex-row flex-wrap justify-center gap-2 md:gap-4"
    >
      {typeof width === 'number' &&
        books?.map((book) => (
          <BookCard
            key={book.id}
            size={width < 800 ? 'small' : 'default'}
            book={book}
          />
        ))}
    </View>
  );
};
