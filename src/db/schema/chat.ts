import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const chatTable = pgTable(
  "chat",
  {
    id: varchar({ length: 36 }).primaryKey(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow()
  },
  (table) => [index("chat_user_updated_idx").on(table.userId, table.updatedAt)]
);

export const chatRelations = relations(chatTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [chatTable.userId],
    references: [usersTable.id]
  }),
  messages: many(chatMessageTable)
}));

export const chatMessageTable = pgTable(
  "chat_message",
  {
    id: varchar({ length: 255 }).primaryKey(),
    chatId: varchar({ length: 36 })
      .notNull()
      .references(() => chatTable.id, { onDelete: "cascade" }),
    role: varchar({ length: 20 }).notNull(),
    parts: jsonb().notNull(),
    createdAt: timestamp().notNull().defaultNow()
  },
  (table) => [index("chat_message_chat_idx").on(table.chatId)]
);

export const chatMessageRelations = relations(chatMessageTable, ({ one }) => ({
  chat: one(chatTable, {
    fields: [chatMessageTable.chatId],
    references: [chatTable.id]
  })
}));
