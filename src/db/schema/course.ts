import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { boolean, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { paperYearTable } from "./paper";
import { questionTable } from "./question";
import { usersTable } from "./user";

export const courseTable = pgTable("course", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 255 }).notNull(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const courseRelations = relations(courseTable, ({ many }) => ({
  courseYears: many(courseYearTable)
}));

export const courseYearTable = pgTable("course_year", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  year: integer().notNull(),
  courseId: integer().references(() => courseTable.id),
  url: varchar({ length: 255 }).notNull(),

  michaelmas: boolean().notNull().default(false),
  lent: boolean().notNull().default(false),
  easter: boolean().notNull().default(false),

  lectures: integer(),
  moodleId: varchar({ length: 255 }),
  suggestedSupervisions: integer(),
  format: varchar({ length: 255 }),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const courseYearRelations = relations(
  courseYearTable,
  ({ one, many }) => ({
    course: one(courseTable, {
      fields: [courseYearTable.courseId],
      references: [courseTable.id]
    }),
    courseYearPaperYears: many(courseYearPaperYearTable),
    courseYearLecturers: many(courseYearLecturerTable),
    questions: many(questionTable)
  })
);

export const courseYearPaperYearTable = pgTable("course_year_paper_year", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseYearId: integer().references(() => courseYearTable.id),
  paperYearId: integer().references(() => paperYearTable.id)
});

export const courseYearPaperYearRelations = relations(
  courseYearPaperYearTable,
  ({ one }) => ({
    courseYear: one(courseYearTable, {
      fields: [courseYearPaperYearTable.courseYearId],
      references: [courseYearTable.id]
    }),
    paperYear: one(paperYearTable, {
      fields: [courseYearPaperYearTable.paperYearId],
      references: [paperYearTable.id]
    })
  })
);

export const courseYearLecturerTable = pgTable("course_year_lecturer", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseYearId: integer().references(() => courseYearTable.id),
  lecturerId: integer().references(() => usersTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const courseYearLecturerRelations = relations(
  courseYearLecturerTable,
  ({ one }) => ({
    courseYear: one(courseYearTable, {
      fields: [courseYearLecturerTable.courseYearId],
      references: [courseYearTable.id]
    }),
    lecturer: one(usersTable, {
      fields: [courseYearLecturerTable.lecturerId],
      references: [usersTable.id]
    })
  })
);
