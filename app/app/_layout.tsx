import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from 'react-query';

import { useIsMobile } from '@/common/hooks/use-screen-size';

import '../global.css';

const queryClient = new QueryClient();
export default function RootLayout() {
  const isMobile = useIsMobile();
  console.log('isMobile', isMobile);
  return (
    <QueryClientProvider client={queryClient}>
      {/* {isMobile ? ( */}
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
      </Stack>
      {/* ) : (
          <Stack initialRouteName="index">
            <Stack.Screen
              name="index"
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
          </Stack>
        )} */}
    </QueryClientProvider>
  );
}
