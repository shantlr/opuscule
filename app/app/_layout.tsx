import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from 'react-query';

import '../global.css';
import { FailedToFetchError } from '@/common/api/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        if (error instanceof FailedToFetchError) {
          return failureCount < 2;
        }
        return failureCount < 3;
      },
    },
  },
});
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack initialRouteName="(tabs)">
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="book/[bookId]/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="book/[bookId]/chapter/[chapterId]/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
