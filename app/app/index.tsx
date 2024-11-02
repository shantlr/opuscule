import { ScrollView, Text } from 'react-native';
import styled from 'styled-components/native';

import { fromTheme } from '@/constants/theme';
import { useLastUpdatedBooks } from '@/features/books/hooks/use-books';
import { BooksGrid } from '@/features/books/ui/books-grid';

const Container = styled.SafeAreaView`
  height: 100%;
  background: ${fromTheme.colors.mainbg};
`;

export default function Index() {
  const { data, error, isLoading } = useLastUpdatedBooks({});

  console.log(data);

  return (
    <Container>
      <ScrollView className="px-2 md:px-4">
        {isLoading && <Text>Loading...</Text>}
        {!!error && (
          <Text>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Text>
        )}
        <BooksGrid books={data?.books}></BooksGrid>
      </ScrollView>
    </Container>
  );
}
