import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('member').notNull(),
  locale: text('locale').default('zh').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  moduleMembers: many(moduleMembers),
}));

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  description: text('description'),
  descriptionZh: text('description_zh'),
  type: text('type').notNull(),
  config: jsonb('config'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const modulesRelations = relations(modules, ({ many }) => ({
  members: many(moduleMembers),
}));

export const moduleMembers = pgTable(
  'module_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    moduleId: uuid('module_id')
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('module_members_user_module_idx').on(table.userId, table.moduleId),
  ]
);

export const moduleMembersRelations = relations(moduleMembers, ({ one }) => ({
  user: one(users, {
    fields: [moduleMembers.userId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [moduleMembers.moduleId],
    references: [modules.id],
  }),
}));

export const allowedEmails = pgTable('allowed_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  addedBy: uuid('added_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
