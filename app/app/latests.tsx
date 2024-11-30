import { Redirect } from 'expo-router';
import { SafeAreaView, ScrollView, Text } from 'react-native';

import { BooksGrid } from '@/features/books/ui-books-grid';
import { useLastUpdatedBooks } from '@/features/books/use-book';

export default function Index() {
  const { data, error, isLoading } = useLastUpdatedBooks({});

  if (!!data && data.books.length === 0) {
    return <Redirect href="/welcome" />;
  }

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
