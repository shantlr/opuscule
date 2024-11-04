import { SafeAreaView, ScrollView, Text } from 'react-native';

import { useLastUpdatedBooks } from '@/features/books/hooks/use-books';
import { BooksGrid } from '@/features/books/ui/books-grid';

export default function Index() {
  const { data, error, isLoading } = useLastUpdatedBooks({});

  return (
    <SafeAreaView className="h-full">
      <ScrollView className="px-2 md:px-4">
        {isLoading && <Text>Loading...</Text>}
        {!!error && (
          <Text>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Text>
        )}
        <BooksGrid books={data?.books}></BooksGrid>
      </ScrollView>
    </SafeAreaView>
  );
}
