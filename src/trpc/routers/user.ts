import type { User } from "@clerk/nextjs/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { commentTable } from "@/db/schema/comment";
import {
  courseTable,
  courseYearLecturerTable,
  courseYearTable
} from "@/db/schema/course";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionAuthorTable, questionTable } from "@/db/schema/question";
import {
  userQuestionAnswerTable,
  userSettingsTable,
  usersTable
} from "@/db/schema/user";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

const filterClerkUser = (clerkUser: User) => {
  return {
    id: clerkUser.id,
    imageUrl: clerkUser.imageUrl,
    primaryEmailAddressId: clerkUser.primaryEmailAddressId,
    lastSignInAt: clerkUser.lastSignInAt,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses.map((email) => ({
      id: email.id,
      emailAddress: email.emailAddress
    })),
    publicMetadata: clerkUser.publicMetadata,
    lastActiveAt: clerkUser.lastActiveAt
  };
};

export const userRouter = createTRPCRouter({
  getUserByCrsid: baseProcedure
    .input(z.object({ crsid: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.crsid, input.crsid)
      });
      if (!user || !user.clerkId) throw new Error("User not found");
      const clerkUser = await ctx.clerkClient.users.getUser(user.clerkId);
      return {
        ...user,
        clerkUser: filterClerkUser(clerkUser)
      };
    }),
  getUserByClerkId: baseProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user, clerkUser] = await Promise.all([
        db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, input.clerkId)
        }),
        ctx.clerkClient.users.getUser(input.clerkId)
      ]);
      return {
        ...user,
        clerkUser: filterClerkUser(clerkUser)
      };
    }),
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, ctx.userId)
    });
    if (!user) throw new Error("User not found");

    const userSettings = await db.query.userSettingsTable.findFirst({
      with: { user: true },
      where: eq(userSettingsTable.userId, user.id)
    });
    return userSettings;
  }),
  updateUserSettings: protectedProcedure
    .input(
      z.object({
        triposPartId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });

      if (!user) throw new Error("User not found");

      await db
        .update(userSettingsTable)
        .set({
          triposPartId: input.triposPartId
        })
        .where(eq(userSettingsTable.userId, user.id));

      return { success: true };
    }),

  getProfile: baseProcedure
    .input(z.object({ crsid: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.crsid, input.crsid)
      });
      if (!user) throw new Error("User not found");

      const [
        clerkUser,
        lecturerEntries,
        questionsAuthored,
        answersCountResult,
        commentsCountResult,
        recentComments
      ] = await Promise.all([
        user.clerkId
          ? ctx.clerkClient.users.getUser(user.clerkId)
          : Promise.resolve(null),
        db
          .select({
            courseId: courseTable.id,
            courseName: courseTable.name,
            courseCode: courseTable.code,
            year: courseYearTable.year
          })
          .from(courseYearLecturerTable)
          .innerJoin(
            courseYearTable,
            eq(courseYearLecturerTable.courseYearId, courseYearTable.id)
          )
          .innerJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(eq(courseYearLecturerTable.lecturerId, user.id)),
        db
          .select({
            questionId: questionTable.id,
            questionNumber: questionTable.questionNumber,
            paperName: paperTable.name,
            year: paperYearTable.year,
            courseName: courseTable.name,
            courseCode: courseTable.code
          })
          .from(questionAuthorTable)
          .innerJoin(
            questionTable,
            eq(questionAuthorTable.questionId, questionTable.id)
          )
          .innerJoin(
            paperYearTable,
            eq(questionTable.paperYearId, paperYearTable.id)
          )
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(
            courseYearTable,
            eq(questionTable.courseYearId, courseYearTable.id)
          )
          .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(eq(questionAuthorTable.authorId, user.id)),
        db
          .select({ count: count() })
          .from(userQuestionAnswerTable)
          .where(eq(userQuestionAnswerTable.userId, user.id)),
        db
          .select({ count: count() })
          .from(commentTable)
          .where(eq(commentTable.authorId, user.id)),
        db
          .select({
            id: commentTable.id,
            content: commentTable.content,
            score: commentTable.score,
            isDeleted: commentTable.isDeleted,
            createdAt: commentTable.createdAt,
            questionId: commentTable.questionId,
            courseId: commentTable.courseId
          })
          .from(commentTable)
          .where(eq(commentTable.authorId, user.id))
          .orderBy(desc(commentTable.createdAt))
          .limit(20)
      ]);

      const coursesLecturedMap = new Map<
        number,
        { id: number; name: string; code: string; years: number[] }
      >();
      for (const entry of lecturerEntries) {
        if (coursesLecturedMap.has(entry.courseId)) {
          coursesLecturedMap.get(entry.courseId)!.years.push(entry.year);
        } else {
          coursesLecturedMap.set(entry.courseId, {
            id: entry.courseId,
            name: entry.courseName,
            code: entry.courseCode,
            years: [entry.year]
          });
        }
      }
      const coursesLectured = Array.from(coursesLecturedMap.values()).map(
        (c) => ({
          ...c,
          years: c.years.sort((a, b) => a - b)
        })
      );

      const [answersCount] = answersCountResult;
      const [commentsCount] = commentsCountResult;

      return {
        ...user,
        clerkUser: clerkUser ? filterClerkUser(clerkUser) : null,
        isLecturer: coursesLectured.length > 0,
        coursesLectured,
        questionsAuthored,
        totalAnswers: answersCount?.count ?? 0,
        totalComments: commentsCount?.count ?? 0,
        recentComments: recentComments.map((c) => ({
          ...c,
          content: c.isDeleted ? "[deleted]" : c.content
        }))
      };
    })
});
