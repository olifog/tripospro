import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { integer, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { questionTable } from "./question";
import { triposPartTable } from "./tripos";
import { courseYearLecturerTable } from "./course";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  crsid: varchar({ length: 255 }).unique(),
  name: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  admin: boolean().notNull().default(false),
  picture: varchar({ length: 255 }),
  clerkId: varchar({ length: 255 }).unique(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  userSettings: one(userSettingsTable, {
    fields: [usersTable.id],
    references: [userSettingsTable.userId],
  }),
  questionsAuthored: many(questionTable, { relationName: "questionsAuthored" }),
  userQuestionAnswers: many(userQuestionAnswerTable),
  courseYearLecturers: many(courseYearLecturerTable),
}));


export const userQuestionAnswerTable = pgTable("user_question_answer", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => usersTable.id),
  questionId: integer().references(() => questionTable.id),
  timeTaken: integer(),
  mark: integer(),
  note: text(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const userQuestionAnswerRelations = relations(userQuestionAnswerTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userQuestionAnswerTable.userId],
    references: [usersTable.id]
  }),
  question: one(questionTable, {
    fields: [userQuestionAnswerTable.questionId],
    references: [questionTable.id]
  })
}));

export const userSettingsTable = pgTable("user_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => usersTable.id),
  
  triposPartId: integer().references(() => triposPartTable.id),
});

export const userSettingsRelations = relations(userSettingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userSettingsTable.userId],
    references: [usersTable.id]
  }),
  triposPart: one(triposPartTable, {
    fields: [userSettingsTable.triposPartId],
    references: [triposPartTable.id]
  })
}));

