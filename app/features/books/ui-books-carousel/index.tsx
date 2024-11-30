import { View } from 'react-native';

import { ApiBookSummary } from '@/common/api/types';

import { BookCard } from '../ui-book-card';

export const BooksCarousel = ({ books }: { books: ApiBookSummary[] }) => {
  return (
    <View role="list" className="flex flex-row overflow-auto gap-4 px-8">
      {books.map((book) => (
        <BookCard key={book.id} size="small" book={book} />
      ))}
    </View>
  );
};
