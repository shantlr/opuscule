import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/data/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./data/sqlite.db',
  },
});
