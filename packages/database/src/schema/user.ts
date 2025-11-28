import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

import { tenants } from './tenant.js';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  passwordHash: varchar('password_hash', { length: 255 }),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  name: varchar('name', { length: 255 }),
  image: varchar('image', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
