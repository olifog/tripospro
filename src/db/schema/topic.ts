import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  varchar
} from "drizzle-orm/pg-core";
import { courseTable } from "./course";
import { questionTable } from "./question";

export const topicTable = pgTable(
  "topic",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer()
      .notNull()
      .references(() => courseTable.id),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [unique().on(t.courseId, t.slug)]
);

export const topicRelations = relations(topicTable, ({ one, many }) => ({
  course: one(courseTable, {
    fields: [topicTable.courseId],
    references: [courseTable.id]
  }),
  questionTopics: many(questionTopicTable)
}));

export const questionTopicTable = pgTable(
  "question_topic",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    questionId: integer()
      .notNull()
      .references(() => questionTable.id),
    topicId: integer()
      .notNull()
      .references(() => topicTable.id),
    confidence: real(),
    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [unique().on(t.questionId, t.topicId)]
);

export const questionTopicRelations = relations(
  questionTopicTable,
  ({ one }) => ({
    question: one(questionTable, {
      fields: [questionTopicTable.questionId],
      references: [questionTable.id]
    }),
    topic: one(topicTable, {
      fields: [questionTopicTable.topicId],
      references: [topicTable.id]
    })
  })
);

export const courseInsightTable = pgTable(
  "course_insight",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer()
      .notNull()
      .references(() => courseTable.id),
    content: text().notNull(),
    generatedAt: timestamp().notNull(),
    modelUsed: varchar({ length: 100 }).notNull(),
    yearsAnalyzed: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow()
  },
  (t) => [unique().on(t.courseId)]
);

export const courseInsightRelations = relations(
  courseInsightTable,
  ({ one }) => ({
    course: one(courseTable, {
      fields: [courseInsightTable.courseId],
      references: [courseTable.id]
    })
  })
);
