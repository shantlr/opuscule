import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { FailedToFetchError } from '@/common/api/utils';
import { ErrorStatusBar } from '@/common/ui/error-status-bar';
import { LoadingScreen } from '@/common/ui/loading-screen';
import { BooksCarousel } from '@/features/books/ui-books-carousel';
import { BooksGrid } from '@/features/books/ui-books-grid';
import {
  useBookmarkedUnreadBooks,
  useLastUpdatedBooks,
} from '@/features/books/use-book';

export default function Index() {
  const { data, error, isLoading } = useLastUpdatedBooks({});
  const { data: unreadBookmarked } = useBookmarkedUnreadBooks({});

  if (!!data && data.books.length === 0) {
    return <Redirect href="/welcome" />;
  }

  if (isLoading && !data) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="h-full">
      <ScrollView className="px-2 md:px-4">
        {error instanceof FailedToFetchError && (
          <ErrorStatusBar>API unreachable</ErrorStatusBar>
        )}

        {isLoading && (
          <View className="pt-4">
            <ActivityIndicator />
          </View>
        )}

        {!!error && (
          <Text>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Text>
        )}

        {!!unreadBookmarked?.books?.length && (
          <View className="w-full mt-8">
            <Text role="heading" className="mb-2 mx-4 text-xl">
              Favorites
            </Text>
            <BooksCarousel books={unreadBookmarked?.books} />
          </View>
        )}

        <Text role="heading" className="mb-2 mx-4 text-xl">
          Latests
        </Text>
        <BooksGrid books={data?.books}></BooksGrid>
      </ScrollView>
    </SafeAreaView>
  );
}
