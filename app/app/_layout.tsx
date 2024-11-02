import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from 'styled-components/native';

import { theme } from '@/constants/theme';
import '../global.css';

const queryClient = new QueryClient();
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Stack>
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}
