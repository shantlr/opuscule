import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/data/schemas/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./data/sqlite.db',
  },
});
