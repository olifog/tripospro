import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique
} from "drizzle-orm/pg-core";
import { courseTable } from "./course";
import { questionTable } from "./question";
import { usersTable } from "./user";

export const commentTable = pgTable(
  "comment",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    authorId: integer()
      .notNull()
      .references(() => usersTable.id),
    parentId: integer().references((): any => commentTable.id),
    questionId: integer().references(() => questionTable.id),
    courseId: integer().references(() => courseTable.id),
    content: text().notNull(),
    isEdited: boolean().notNull().default(false),
    isDeleted: boolean().notNull().default(false),
    isPinned: boolean().notNull().default(false),
    score: integer().notNull().default(0),
    depth: integer().notNull().default(0),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow()
  },
  (t) => [
    index("comment_question_idx").on(t.questionId, t.createdAt),
    index("comment_course_idx").on(t.courseId, t.createdAt),
    index("comment_author_idx").on(t.authorId, t.createdAt),
    index("comment_parent_idx").on(t.parentId)
  ]
);

export const commentRelations = relations(commentTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [commentTable.authorId],
    references: [usersTable.id]
  }),
  parent: one(commentTable, {
    fields: [commentTable.parentId],
    references: [commentTable.id],
    relationName: "commentReplies"
  }),
  replies: many(commentTable, {
    relationName: "commentReplies"
  }),
  question: one(questionTable, {
    fields: [commentTable.questionId],
    references: [questionTable.id]
  }),
  course: one(courseTable, {
    fields: [commentTable.courseId],
    references: [courseTable.id]
  }),
  votes: many(commentVoteTable)
}));

export const commentVoteTable = pgTable(
  "comment_vote",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id),
    commentId: integer()
      .notNull()
      .references(() => commentTable.id),
    value: integer().notNull(),

    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [
    unique().on(t.userId, t.commentId),
    index("comment_vote_comment_idx").on(t.commentId)
  ]
);

export const commentVoteRelations = relations(
  commentVoteTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [commentVoteTable.userId],
      references: [usersTable.id]
    }),
    comment: one(commentTable, {
      fields: [commentVoteTable.commentId],
      references: [commentTable.id]
    })
  })
);
