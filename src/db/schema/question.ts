import { pgTable } from "drizzle-orm/pg-core";

import { integer, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { paperYearTable } from "./paper";
import { courseYearTable } from "./course";
import { userQuestionAnswerTable, usersTable } from "./user";
import { relations } from "drizzle-orm";

export const questionTable = pgTable("question", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  paperYearId: integer().references(() => paperYearTable.id),
  courseYearId: integer().references(() => courseYearTable.id),
  questionNumber: integer().notNull(),
  url: varchar({ length: 255 }).notNull(),
  solutionUrl: varchar({ length: 255 }),

  examinerComment: text(),
  authorId: integer().references(() => usersTable.id),
  minimumMark: integer(),
  maximumMark: integer(),
  medianMark: integer(),
  attempts: integer(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const questionRelations = relations(questionTable, ({ one, many }) => ({
  paperYear: one(paperYearTable, {
    fields: [questionTable.paperYearId],
    references: [paperYearTable.id]
  }),
  courseYear: one(courseYearTable, {
    fields: [questionTable.courseYearId],
    references: [courseYearTable.id]
  }),
  author: one(usersTable, {
    fields: [questionTable.authorId],
    references: [usersTable.id]
  }),
  userQuestionAnswers: many(userQuestionAnswerTable),
}));