import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  crsid: varchar({ length: 255 }).unique(),
  name: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  admin: boolean().notNull().default(false),
  picture: varchar({ length: 255 }),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const triposTable = pgTable("tripos", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 255 }).notNull(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const triposPartTable = pgTable("tripos_part", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 255 }).notNull(),
  triposId: integer().references(() => triposTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const triposPartYearTable = pgTable("tripos_part_year", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  year: integer().notNull(),
  triposPartId: integer().references(() => triposPartTable.id),

  candidates: integer(),
  starredFirsts: integer(),
  firsts: integer(),
  twoOnes: integer(),
  twoTwos: integer(),
  thirds: integer(),
  unclassed: integer(),
  withdrawn: integer(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const paperTable = pgTable("paper", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  triposId: integer().references(() => triposTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const paperYearTable = pgTable("paper_year", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  year: integer().notNull(),
  paperId: integer().references(() => paperTable.id),
  url: varchar({ length: 255 }).notNull(),
  triposPartYearId: integer().references(() => triposPartYearTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const courseTable = pgTable("course", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 255 }).notNull(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const courseYearTable = pgTable("course_year", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  year: integer().notNull(),
  courseId: integer().references(() => courseTable.id),
  paperYearId: integer().references(() => paperYearTable.id),
  url: varchar({ length: 255 }).notNull(),
  
  michaelmas: boolean().notNull().default(false),
  lent: boolean().notNull().default(false),
  easter: boolean().notNull().default(false),

  lectures: integer(),
  moodleId: varchar({ length: 255 }),
  suggestedSupervisions: integer(),
  format: varchar({ length: 255 }),


  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const courseYearLecturerTable = pgTable("course_year_lecturer", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseYearId: integer().references(() => courseYearTable.id),
  lecturerId: integer().references(() => usersTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

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
  updatedAt: timestamp().notNull().defaultNow(),
});

export const userQuestionAnswerTable = pgTable("user_question_answer", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => usersTable.id),
  questionId: integer().references(() => questionTable.id),
  timeTaken: integer(),
  mark: integer(),
  note: text(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
