import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';

import './index.css';

import { AppRouter } from './pages/index.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>,
);
