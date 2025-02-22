import { pgTable } from "drizzle-orm/pg-core";
import { integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { triposTable } from "./tripos";
import { triposPartYearTable } from "./tripos";
import { relations } from "drizzle-orm";
import { questionTable } from "./question";
import { courseYearTable } from "./course";

export const paperTable = pgTable("paper", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  triposId: integer().references(() => triposTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const paperRelations = relations(paperTable, ({ one, many }) => ({
  tripos: one(triposTable, {
    fields: [paperTable.triposId],
    references: [triposTable.id]
  }),
  paperYears: many(paperYearTable)
}));

export const paperYearTable = pgTable("paper_year", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  year: integer().notNull(),
  paperId: integer().references(() => paperTable.id),
  url: varchar({ length: 255 }).notNull(),
  triposPartYearId: integer().references(() => triposPartYearTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const paperYearRelations = relations(paperYearTable, ({ one, many }) => ({
  paper: one(paperTable, {
    fields: [paperYearTable.paperId],
    references: [paperTable.id]
  }),
  triposPartYear: one(triposPartYearTable, {
    fields: [paperYearTable.triposPartYearId],
    references: [triposPartYearTable.id]
  }),
  questions: many(questionTable),
  courseYears: many(courseYearTable)
}));