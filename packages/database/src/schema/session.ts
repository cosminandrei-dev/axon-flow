import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

import { users } from './user.js';

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
});
