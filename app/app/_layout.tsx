import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from 'react-query';

import '../global.css';
import { defaultApiRetry } from '@/common/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(retryCount, error) {
        return defaultApiRetry(retryCount, error);
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
