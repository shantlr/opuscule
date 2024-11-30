import { ActivityIndicator, View } from 'react-native';

import { BooksGrid } from '@/features/books/ui-books-grid';
import { useBookmarkedBooks } from '@/features/books/use-book';

export default function Booked() {
  const { data, isLoading } = useBookmarkedBooks({});
  return (
    <View>
      {isLoading && (
        <View className="w-full flex flex-row items-center">
          <ActivityIndicator />
        </View>
      )}
      <BooksGrid books={data?.books} />
    </View>
  );
}
