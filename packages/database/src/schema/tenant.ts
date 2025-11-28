import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export interface TenantSettings {
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
}

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 63 }).notNull().unique(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  settings: jsonb('settings').$type<TenantSettings>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
