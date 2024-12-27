import { relations } from 'drizzle-orm';
import {
  foreignKey,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

import { Cookie } from '../types';

export * from './auth';

export const GlobalSettings = sqliteTable('global_settings', {
  id: text('key', {
    enum: ['global'],
  }).primaryKey(),

  /**
   * Actual min delay between each fetch latests for a source
   */
  fetch_latests_min_delay_ms: integer('fetch_latests_min_delay_ms')
    .notNull()
    .default(
      1000 * 60 * 60 * 3, // 3h
    ),
  /**
   * Delay between each check of fetch latests
   */
  fetch_latests_interval_ms: integer('fetch_latests_interval_ms').default(
    30 * 60 * 1000, // 30m
  ),
});

export const HtmlCache = sqliteTable('html_caches', {
  key: text('key').primaryKey(),
  data: text('data'),
  status: integer('status'),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(
    () => new Date(),
  ),
});

export const FetchSession = sqliteTable('fetch_sessions', {
  key: text('key').primaryKey(),
  user_agent: text('user_agent').notNull(),
  cookies: text('cookies', { mode: 'json' }).$type<Cookie[]>().notNull(),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const Book = sqliteTable('books', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: text('title').notNull(),
  description: text('description'),

  cover_s3_bucket: text('s3_bucket'),
  cover_s3_key: text('s3_key'),

  last_chapter_updated_at: integer('last_chapter_updated_at', {
    mode: 'timestamp_ms',
  }),
  last_detail_updated_at: integer('last_detail_updated_at', {
    mode: 'timestamp_ms',
  }),

  created_at: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(
    () => new Date(),
  ),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdateFn(
    () => new Date(),
  ),
});

export const Chapter = sqliteTable(
  'chapters',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),

    chapter_id: text('chapter_id').notNull(),
    chapter_rank: real('chapter_rank').notNull(),

    source_id: text('source_id').notNull(),
    source_book_id: text('source_book_id').notNull(),
    pages: text('pages', { mode: 'json' }).$type<
      {
        s3_key: string;
        s3_bucket: string;
        width: number;
        height: number;
      }[]
    >(),

    published_at: integer('published_at', { mode: 'timestamp_ms' }),
    published_at_accuracy: integer('published_at_accuracy'),
    created_at: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => ({
    source_book_ref: foreignKey({
      columns: [table.source_id, table.source_book_id],
      foreignColumns: [SourceBook.source_id, SourceBook.source_book_id],
      name: 'source_book_ref',
    }),
    uniq: unique('unique_source_chapter').on(
      table.source_id,
      table.source_book_id,
      table.chapter_id,
    ),
  }),
);

export const UserBookState = sqliteTable(
  'user_book_states',
  {
    book_id: text('book_id').notNull(),
    unread_count: integer('unread_count'),
    bookmarked: integer('bookmarked', { mode: 'boolean' }).$defaultFn(
      () => false,
    ),
    updated_at: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdateFn(
      () => new Date(),
    ),
  },
  (t) => ({
    unique: unique('unique_user_book_state').on(t.book_id),
  }),
);

export const UserChapterState = sqliteTable(
  'user_chapter_states',
  {
    chapter_id: text('chapter_id')
      .notNull()
      .references(() => Chapter.id),
    read: integer('read', { mode: 'boolean' }).$defaultFn(() => false),
    read_at: integer('read_at', { mode: 'timestamp_ms' }),
    percentage: real('percentage').$defaultFn(() => 0),
    current_page: integer('current_page').$defaultFn(() => 0),
  },
  (t) => ({
    unique: unique('unique_user_chapter_state').on(t.chapter_id),
  }),
);

export const Source = sqliteTable('sources', {
  id: text('id').primaryKey(),
  subscribed: integer('subscribed', { mode: 'boolean' }).$defaultFn(
    () => false,
  ),
  last_fetched_latests_at: integer('last_fetch', { mode: 'timestamp_ms' }),
});
export const SourceBook = sqliteTable(
  'source_books',
  {
    source_id: text('source_id')
      .notNull()
      .references(() => Source.id),
    source_book_id: text('source_book_id').notNull(),
    source_book_key: text('source_book_key'),

    book_id: text('book_id').references(() => Book.id),

    last_chapter_updated_at: integer('last_chapter_updated_at', {
      mode: 'timestamp_ms',
    }),
    last_fetched_details_at: integer('last_fetched_details_at', {
      mode: 'timestamp_ms',
    }),

    title: text('title').notNull(),
    title_accuracy: integer('title_accuracy'),

    description: text('description'),
    description_accuracy: integer('description_accuracy'),

    cover_s3_bucket: text('cover_s3_bucket'),
    cover_s3_key: text('cover_s3_key'),
    cover_origin_url: text('cover_origin_url'),
  },
  (table) => ({
    id: primaryKey({
      name: 'id',
      columns: [table.source_id, table.source_book_id],
    }),
  }),
);

export const userBookStateRelations = relations(UserBookState, (rel) => ({
  book: rel.one(Book, {
    relationName: 'book',
    fields: [UserBookState.book_id],
    references: [Book.id],
  }),
}));
export const sourceRelations = relations(Source, (rel) => ({
  sourceBooks: rel.many(SourceBook, {
    relationName: 'source',
  }),
}));
export const sourceBookRelations = relations(SourceBook, (rel) => ({
  source: rel.one(Source, {
    relationName: 'source',
    fields: [SourceBook.source_id],
    references: [Source.id],
  }),
  book: rel.one(Book, {
    relationName: 'book',
    fields: [SourceBook.book_id],
    references: [Book.id],
  }),
  chapters: rel.many(Chapter, {
    relationName: 'sourceBook',
  }),
}));
export const bookRelations = relations(Book, (rel) => ({
  sourceBooks: rel.many(SourceBook, {
    relationName: 'book',
  }),
  userState: rel.one(UserBookState, {
    relationName: 'book',
    fields: [Book.id],
    references: [UserBookState.book_id],
  }),
}));
export const chapterRelations = relations(Chapter, (rel) => ({
  sourceBook: rel.one(SourceBook, {
    relationName: 'sourceBook',
    fields: [Chapter.source_book_id],
    references: [SourceBook.source_book_id],
  }),
  userState: rel.one(UserChapterState, {
    relationName: 'chapter',
    fields: [Chapter.id],
    references: [UserChapterState.chapter_id],
  }),
}));
export const userChapterStateRelations = relations(UserChapterState, (rel) => ({
  chapter: rel.one(Chapter, {
    relationName: 'chapter',
    fields: [UserChapterState.chapter_id],
    references: [Chapter.id],
  }),
}));

// export const UserSource = sqliteTable('user_sources', {
//   id: text('id').primaryKey(),
//   user_id: text('user_id'),
//   subscribed: integer('subscribed', { mode: 'boolean' }),
//   subscribed_at: integer('subscribed_at', { mode: 'timestamp_ms' }),
// });
