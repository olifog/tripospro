import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { db as dbInstance } from "@/db";
import { commentTable, commentVoteTable } from "@/db/schema/comment";
import { courseTable } from "@/db/schema/course";
import { questionTable } from "@/db/schema/question";
import { usersTable } from "@/db/schema/user";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "../init";

const MAX_INLINE_DEPTH = 4;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_REPLIES_INLINE = 3;

type CommentWithReplies = {
  id: number;
  authorId: number;
  parentId: number | null;
  questionId: number | null;
  courseId: number | null;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  score: number;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    crsid: string | null;
    name: string | null;
    picture: string | null;
  };
  userVote: number | null;
  replies: CommentWithReplies[];
  hasMoreReplies: boolean;
};

async function fetchCommentsWithReplies(
  db: typeof dbInstance,
  commentIds: number[],
  currentUserId: number | null,
  currentDepth: number
): Promise<CommentWithReplies[]> {
  if (commentIds.length === 0) return [];

  const comments = await db
    .select({
      id: commentTable.id,
      authorId: commentTable.authorId,
      parentId: commentTable.parentId,
      questionId: commentTable.questionId,
      courseId: commentTable.courseId,
      content: commentTable.content,
      isEdited: commentTable.isEdited,
      isDeleted: commentTable.isDeleted,
      isPinned: commentTable.isPinned,
      score: commentTable.score,
      depth: commentTable.depth,
      createdAt: commentTable.createdAt,
      updatedAt: commentTable.updatedAt,
      authorCrsid: usersTable.crsid,
      authorName: usersTable.name,
      authorPicture: usersTable.picture
    })
    .from(commentTable)
    .leftJoin(usersTable, eq(commentTable.authorId, usersTable.id))
    .where(inArray(commentTable.id, commentIds));

  const userVotes: Map<number, number> = new Map();
  if (currentUserId && commentIds.length > 0) {
    const votes = await db
      .select({
        commentId: commentVoteTable.commentId,
        value: commentVoteTable.value
      })
      .from(commentVoteTable)
      .where(
        and(
          eq(commentVoteTable.userId, currentUserId),
          inArray(commentVoteTable.commentId, commentIds)
        )
      );
    for (const v of votes) {
      userVotes.set(v.commentId, v.value);
    }
  }

  // Batch-fetch all children for the current level
  let allChildren: { id: number; parentId: number | null }[] = [];
  let childCountByParent: Map<number, number> = new Map();

  if (currentDepth < MAX_INLINE_DEPTH && commentIds.length > 0) {
    allChildren = await db
      .select({
        id: commentTable.id,
        parentId: commentTable.parentId,
        score: commentTable.score,
        createdAt: commentTable.createdAt
      })
      .from(commentTable)
      .where(inArray(commentTable.parentId, commentIds))
      .orderBy(desc(commentTable.score), desc(commentTable.createdAt));
  } else if (commentIds.length > 0) {
    const counts = await db
      .select({
        parentId: commentTable.parentId,
        count: count()
      })
      .from(commentTable)
      .where(inArray(commentTable.parentId, commentIds))
      .groupBy(commentTable.parentId);
    for (const c of counts) {
      if (c.parentId !== null) {
        childCountByParent.set(c.parentId, c.count);
      }
    }
  }

  // Group children by parent, take first N
  const childrenByParent = new Map<number, number[]>();
  const hasMoreByParent = new Map<number, boolean>();
  for (const child of allChildren) {
    if (child.parentId === null) continue;
    const existing = childrenByParent.get(child.parentId) ?? [];
    if (existing.length < DEFAULT_REPLIES_INLINE) {
      existing.push(child.id);
    }
    childrenByParent.set(child.parentId, existing);
    if (existing.length >= DEFAULT_REPLIES_INLINE) {
      hasMoreByParent.set(child.parentId, true);
    }
  }
  // Check for "more" based on total count vs what we took
  for (const [parentId, children] of childrenByParent) {
    const totalForParent = allChildren.filter(
      (c) => c.parentId === parentId
    ).length;
    if (totalForParent > children.length) {
      hasMoreByParent.set(parentId, true);
    }
  }

  // Recurse once for all children at this level
  const allChildIds = Array.from(childrenByParent.values()).flat();
  const childComments =
    allChildIds.length > 0
      ? await fetchCommentsWithReplies(
          db,
          allChildIds,
          currentUserId,
          currentDepth + 1
        )
      : [];
  const childCommentsById = new Map(childComments.map((c) => [c.id, c]));

  // Preserve original order from commentIds
  const commentsById = new Map(comments.map((c) => [c.id, c]));
  const result: CommentWithReplies[] = [];

  for (const id of commentIds) {
    const c = commentsById.get(id);
    if (!c) continue;

    const replyIds = childrenByParent.get(c.id) ?? [];
    const replies = replyIds
      .map((rid) => childCommentsById.get(rid))
      .filter((r): r is CommentWithReplies => r !== undefined);

    const hasMore =
      currentDepth < MAX_INLINE_DEPTH
        ? hasMoreByParent.get(c.id) ?? false
        : (childCountByParent.get(c.id) ?? 0) > 0;

    result.push({
      id: c.id,
      authorId: c.authorId,
      parentId: c.parentId,
      questionId: c.questionId,
      courseId: c.courseId,
      content: c.isDeleted ? "[deleted]" : c.content,
      isEdited: c.isEdited,
      isDeleted: c.isDeleted,
      isPinned: c.isPinned,
      score: c.score,
      depth: c.depth,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: {
        id: c.authorId,
        crsid: c.authorCrsid,
        name: c.authorName,
        picture: c.authorPicture
      },
      userVote: userVotes.get(c.id) ?? null,
      replies,
      hasMoreReplies: hasMore
    });
  }

  return result;
}

async function resolveUserId(
  db: typeof dbInstance,
  clerkUserId: string | null
) {
  if (!clerkUserId) return null;
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkUserId)
  });
  return user?.id ?? null;
}

async function fetchThreadPage(
  db: typeof dbInstance,
  filter: ReturnType<typeof eq>,
  sort: "date_desc" | "date_asc" | "votes_desc" | "votes_asc",
  limit: number,
  cursor: number | undefined,
  currentUserId: number | null
) {
  const orderBy = (() => {
    switch (sort) {
      case "date_desc":
        return [desc(commentTable.createdAt)];
      case "date_asc":
        return [asc(commentTable.createdAt)];
      case "votes_asc":
        return [asc(commentTable.score), asc(commentTable.createdAt)];
      case "votes_desc":
      default:
        return [desc(commentTable.score), desc(commentTable.createdAt)];
    }
  })();

  const topLevel = await db
    .select({
      id: commentTable.id,
      score: commentTable.score,
      createdAt: commentTable.createdAt
    })
    .from(commentTable)
    .where(and(filter, isNull(commentTable.parentId)))
    .orderBy(...orderBy)
    .limit(limit + 1)
    .offset(cursor ?? 0);

  const hasNextPage = topLevel.length > limit;
  const ids = topLevel.slice(0, limit).map((c) => c.id);

  const comments = await fetchCommentsWithReplies(db, ids, currentUserId, 0);

  const byId = new Map(comments.map((c) => [c.id, c]));
  const ordered = ids.map((id) => byId.get(id)!).filter(Boolean);

  return {
    comments: ordered,
    nextCursor: hasNextPage ? (cursor ?? 0) + limit : null
  };
}

const sortEnum = z.enum(["date_desc", "date_asc", "votes_desc", "votes_asc"]).default("votes_desc");
const paginationInput = {
  cursor: z.number().optional(),
  limit: z.number().min(1).max(50).default(DEFAULT_PAGE_SIZE)
};

export const commentRouter = createTRPCRouter({
  getByQuestion: baseProcedure
    .input(
      z.object({
        questionId: z.number(),
        sort: sortEnum,
        ...paginationInput
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);
      return fetchThreadPage(
        ctx.db,
        eq(commentTable.questionId, input.questionId),
        input.sort,
        input.limit,
        input.cursor,
        userId
      );
    }),

  getByCourse: baseProcedure
    .input(
      z.object({
        courseId: z.number(),
        sort: sortEnum,
        ...paginationInput
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);
      return fetchThreadPage(
        ctx.db,
        eq(commentTable.courseId, input.courseId),
        input.sort,
        input.limit,
        input.cursor,
        userId
      );
    }),

  getReplies: baseProcedure
    .input(
      z.object({
        parentId: z.number(),
        ...paginationInput
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);

      const parent = await ctx.db.query.commentTable.findFirst({
        where: eq(commentTable.id, input.parentId)
      });
      if (!parent) throw new TRPCError({ code: "NOT_FOUND" });

      const replies = await ctx.db
        .select({ id: commentTable.id })
        .from(commentTable)
        .where(eq(commentTable.parentId, input.parentId))
        .orderBy(desc(commentTable.score), desc(commentTable.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor ?? 0);

      const hasNextPage = replies.length > input.limit;
      const ids = replies.slice(0, input.limit).map((c) => c.id);

      const comments = await fetchCommentsWithReplies(
        ctx.db,
        ids,
        userId,
        parent.depth + 1
      );

      return {
        comments,
        nextCursor: hasNextPage ? (input.cursor ?? 0) + input.limit : null
      };
    }),

  getByUser: baseProcedure
    .input(
      z.object({
        userId: z.number(),
        ...paginationInput
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db
        .select({
          id: commentTable.id,
          content: commentTable.content,
          score: commentTable.score,
          isDeleted: commentTable.isDeleted,
          createdAt: commentTable.createdAt,
          questionId: commentTable.questionId,
          courseId: commentTable.courseId,
          questionName: questionTable.questionNumber,
          courseName: courseTable.name
        })
        .from(commentTable)
        .leftJoin(questionTable, eq(commentTable.questionId, questionTable.id))
        .leftJoin(courseTable, eq(commentTable.courseId, courseTable.id))
        .where(eq(commentTable.authorId, input.userId))
        .orderBy(desc(commentTable.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor ?? 0);

      return {
        comments: comments.slice(0, input.limit).map((c) => ({
          ...c,
          content: c.isDeleted ? "[deleted]" : c.content
        })),
        nextCursor:
          comments.length > input.limit
            ? (input.cursor ?? 0) + input.limit
            : null
      };
    }),

  getTopComment: baseProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);

      const topComment = await ctx.db
        .select({
          id: commentTable.id,
          content: commentTable.content,
          score: commentTable.score,
          isDeleted: commentTable.isDeleted,
          createdAt: commentTable.createdAt,
          authorCrsid: usersTable.crsid,
          authorName: usersTable.name,
          authorPicture: usersTable.picture
        })
        .from(commentTable)
        .leftJoin(usersTable, eq(commentTable.authorId, usersTable.id))
        .where(
          and(
            eq(commentTable.questionId, input.questionId),
            isNull(commentTable.parentId),
            eq(commentTable.isDeleted, false)
          )
        )
        .orderBy(desc(commentTable.score), desc(commentTable.createdAt))
        .limit(1);

      if (topComment.length === 0) return null;

      const c = topComment[0];
      let userVote: number | null = null;
      if (userId) {
        const vote = await ctx.db.query.commentVoteTable.findFirst({
          where: and(
            eq(commentVoteTable.userId, userId),
            eq(commentVoteTable.commentId, c.id)
          )
        });
        userVote = vote?.value ?? null;
      }

      return {
        id: c.id,
        content: c.content,
        score: c.score,
        createdAt: c.createdAt,
        author: {
          crsid: c.authorCrsid,
          name: c.authorName,
          picture: c.authorPicture
        },
        userVote
      };
    }),

  getCount: baseProcedure
    .input(
      z.object({
        questionId: z.number().optional(),
        courseId: z.number().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.questionId)
        conditions.push(eq(commentTable.questionId, input.questionId));
      if (input.courseId)
        conditions.push(eq(commentTable.courseId, input.courseId));
      if (conditions.length === 0) return { count: 0 };

      conditions.push(eq(commentTable.isDeleted, false));

      const result = await ctx.db
        .select({ count: count() })
        .from(commentTable)
        .where(and(...conditions));

      return { count: result[0]?.count ?? 0 };
    }),

  create: protectedProcedure
    .input(
      z
        .object({
          content: z.string().min(1).max(10000),
          questionId: z.number().optional(),
          courseId: z.number().optional(),
          parentId: z.number().optional()
        })
        .refine(
          (d) =>
            (d.questionId && !d.courseId) ||
            (!d.questionId && d.courseId) ||
            d.parentId,
          {
            message:
              "Must specify either questionId or courseId, or a parentId"
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      let depth = 0;
      let questionId = input.questionId ?? null;
      let courseId = input.courseId ?? null;

      if (input.parentId) {
        const parent = await ctx.db.query.commentTable.findFirst({
          where: eq(commentTable.id, input.parentId)
        });
        if (!parent)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found"
          });
        depth = parent.depth + 1;
        questionId = parent.questionId;
        courseId = parent.courseId;
      }

      const [created] = await ctx.db
        .insert(commentTable)
        .values({
          authorId: user.id,
          parentId: input.parentId ?? null,
          questionId,
          courseId,
          content: input.content,
          depth,
          score: 1
        })
        .returning();

      await ctx.db.insert(commentVoteTable).values({
        userId: user.id,
        commentId: created.id,
        value: 1
      });

      await ctx.db
        .update(usersTable)
        .set({ karma: sql`${usersTable.karma} + 1` })
        .where(eq(usersTable.id, user.id));

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        commentId: z.number(),
        content: z.string().min(1).max(10000)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const comment = await ctx.db.query.commentTable.findFirst({
        where: eq(commentTable.id, input.commentId)
      });
      if (!comment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found"
        });
      if (comment.authorId !== user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your comment" });

      const [updated] = await ctx.db
        .update(commentTable)
        .set({
          content: input.content,
          isEdited: true,
          updatedAt: new Date()
        })
        .where(eq(commentTable.id, input.commentId))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const comment = await ctx.db.query.commentTable.findFirst({
        where: eq(commentTable.id, input.commentId)
      });
      if (!comment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found"
        });
      if (comment.authorId !== user.id && !user.admin)
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your comment" });

      await ctx.db
        .update(commentTable)
        .set({
          isDeleted: true,
          content: "[deleted]",
          updatedAt: new Date()
        })
        .where(eq(commentTable.id, input.commentId));

      return { success: true };
    }),

  vote: protectedProcedure
    .input(
      z.object({
        commentId: z.number(),
        value: z.union([z.literal(1), z.literal(-1), z.literal(0)])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const comment = await ctx.db.query.commentTable.findFirst({
        where: eq(commentTable.id, input.commentId)
      });
      if (!comment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found"
        });

      const existingVote = await ctx.db.query.commentVoteTable.findFirst({
        where: and(
          eq(commentVoteTable.userId, user.id),
          eq(commentVoteTable.commentId, input.commentId)
        )
      });

      const oldValue = existingVote?.value ?? 0;
      const scoreDelta = input.value - oldValue;

      if (existingVote) {
        if (input.value === 0) {
          await ctx.db
            .delete(commentVoteTable)
            .where(eq(commentVoteTable.id, existingVote.id));
        } else {
          await ctx.db
            .update(commentVoteTable)
            .set({ value: input.value })
            .where(eq(commentVoteTable.id, existingVote.id));
        }
      } else if (input.value !== 0) {
        await ctx.db.insert(commentVoteTable).values({
          userId: user.id,
          commentId: input.commentId,
          value: input.value
        });
      }

      if (scoreDelta !== 0) {
        await ctx.db
          .update(commentTable)
          .set({
            score: sql`${commentTable.score} + ${scoreDelta}`
          })
          .where(eq(commentTable.id, input.commentId));

        await ctx.db
          .update(usersTable)
          .set({
            karma: sql`${usersTable.karma} + ${scoreDelta}`
          })
          .where(eq(usersTable.id, comment.authorId));
      }

      return { success: true, newScore: comment.score + scoreDelta };
    }),

  pin: protectedProcedure
    .input(
      z.object({
        commentId: z.number(),
        pinned: z.boolean()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (!user.admin)
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });

      await ctx.db
        .update(commentTable)
        .set({ isPinned: input.pinned, updatedAt: new Date() })
        .where(eq(commentTable.id, input.commentId));

      return { success: true };
    })
});
