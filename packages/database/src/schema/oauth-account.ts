import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { users } from './user.js';

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: integer('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('oauth_accounts_provider_account_idx').on(table.provider, table.providerAccountId)],
);
