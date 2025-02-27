import { pgTable } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { courseYearTable } from "./course";
import { paperYearTable } from "./paper";
import { userQuestionAnswerTable, usersTable } from "./user";

export const questionTable = pgTable("question", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  paperYearId: integer().references(() => paperYearTable.id),
  courseYearId: integer().references(() => courseYearTable.id),
  questionNumber: integer().notNull(),
  url: varchar({ length: 255 }).notNull(),
  solutionUrl: varchar({ length: 255 }),

  examinerComment: text(),
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
  authors: many(questionAuthorTable),
  userQuestionAnswers: many(userQuestionAnswerTable)
}));

export const questionAuthorTable = pgTable("question_author", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  questionId: integer().references(() => questionTable.id),
  authorId: integer().references(() => usersTable.id),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const questionAuthorRelations = relations(questionAuthorTable, ({ one }) => ({
  question: one(questionTable, {
    fields: [questionAuthorTable.questionId],
    references: [questionTable.id]
  }),
  author: one(usersTable, {
    fields: [questionAuthorTable.authorId],
    references: [usersTable.id]
  })
}));
