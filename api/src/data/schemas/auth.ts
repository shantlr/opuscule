import { randomBytes } from 'crypto';

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const User = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),

  first_name: text('first_name'),
  last_name: text('last_name'),
  full_name: text('full_name'),
  email: text('email').unique(),

  google_sub: text('google_sub').unique(),

  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$onUpdateFn(() => new Date()),

  google_encrypted_refresh_token: text('google_encrypted_refresh_token'),
  google_encrypted_refresh_token_iv: text('google_encrypted_refresh_token_iv'),
});

export const AuthSession = sqliteTable('auth_sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),

  token: text('token')
    .notNull()
    .$defaultFn(() => randomBytes(64).toString('base64')),

  origin: text('origin', {
    enum: ['google'],
  }).notNull(),

  user_id: text('user_id').notNull(),

  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$onUpdateFn(() => new Date()),
  expires_at: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp_ms' }),
});
