import { ActivityIndicator, View } from 'react-native';

import { useBookmarkedBooks } from '@/features/books/hooks/use-books';
import { BooksGrid } from '@/features/books/ui/books-grid';

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
