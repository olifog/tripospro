import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

import { integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { paperYearTable } from "./paper";
import { paperTable } from "./paper";

export const triposTable = pgTable("tripos", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 255 }).notNull(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const triposRelations = relations(triposTable, ({ many }) => ({
  parts: many(triposPartTable),
  papers: many(paperTable)
}));

export const triposPartTable = pgTable("tripos_part", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 255 }).notNull(),
  triposId: integer().references(() => triposTable.id),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const triposPartRelations = relations(triposPartTable, ({ many, one }) => ({
  triposPartYears: many(triposPartYearTable),
  tripos: one(triposTable, {
    fields: [triposPartTable.triposId],
    references: [triposTable.id]
  })
}));

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
  updatedAt: timestamp().notNull().defaultNow()
});

export const triposPartYearRelations = relations(triposPartYearTable, ({ many, one }) => ({
  paperYears: many(paperYearTable),
  triposPart: one(triposPartTable, {
    fields: [triposPartYearTable.triposPartId],
    references: [triposPartTable.id],
  }),
}));


