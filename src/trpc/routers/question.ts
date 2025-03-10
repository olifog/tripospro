import { courseTable, courseYearTable } from "@/db/schema/course";
import { paperYearTable } from "@/db/schema/paper";
import { paperTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";
import { userQuestionAnswerTable, usersTable } from "@/db/schema/user";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { baseProcedure, protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const questionRouter = createTRPCRouter({
  getQuestion: baseProcedure
    .input(
      z.object({
        paperNumber: z.string(),
        year: z.string(),
        questionNumber: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const questionResponse = await ctx.db
        .select()
        .from(paperTable)
        .leftJoin(paperYearTable, eq(paperTable.id, paperYearTable.paperId))
        .leftJoin(
          triposPartYearTable,
          eq(paperYearTable.triposPartYearId, triposPartYearTable.id)
        )
        .leftJoin(
          triposPartTable,
          eq(triposPartYearTable.triposPartId, triposPartTable.id)
        )
        .leftJoin(
          questionTable,
          eq(paperYearTable.id, questionTable.paperYearId)
        )
        .leftJoin(
          courseYearTable,
          eq(questionTable.courseYearId, courseYearTable.id)
        )
        .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
        .where(
          and(
            eq(paperTable.name, input.paperNumber),
            eq(paperYearTable.year, Number.parseInt(input.year)),
            eq(
              questionTable.questionNumber,
              Number.parseInt(input.questionNumber)
            )
          )
        );

      if (questionResponse.length !== 1) throw new Error("Question not found");

      const question = questionResponse[0].question;
      if (!question) throw new Error("Question not found");

      const courseName = questionResponse[0].course?.name ?? "";
      const courseId = questionResponse[0].course?.id ?? "";
      const paperCandidates =
        questionResponse[0].tripos_part_year?.candidates ?? 0;
      const triposPartCode = questionResponse[0].tripos_part?.code;
      const triposPartName = questionResponse[0].tripos_part?.name;

      if (ctx.userId) {
        return {
          ...question,
          courseName,
          courseId,
          paperCandidates,
          triposPartCode,
          triposPartName
        };
      }

      return {
        id: question.id,
        paperYearId: question.paperYearId,
        courseYearId: question.courseYearId,
        questionNumber: question.questionNumber,
        url: question.url,
        solutionUrl: question.solutionUrl,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        courseName,
        courseId,
        triposPartCode,
        triposPartName
      };
    }),
  getQuestionWithContextById: baseProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const question = await ctx.db.query.questionTable.findFirst({
        where: eq(questionTable.id, input.questionId),
        with: {
          courseYear: {
            with: {
              course: true
            }
          },
          paperYear: {
            with: {
              paper: true,
              triposPartYear: {
                with: {
                  triposPart: true
                }
              }
            }
          }
        }
      });
      return question;
    }),
  getUserAnswers: baseProcedure
    .input(
      z.object({
        paperNumber: z.string(),
        year: z.string(),
        questionNumber: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const question = await ctx.db
        .select()
        .from(questionTable)
        .leftJoin(
          paperYearTable,
          eq(questionTable.paperYearId, paperYearTable.id)
        )
        .leftJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
        .where(
          and(
            eq(paperTable.name, input.paperNumber),
            eq(paperYearTable.year, Number.parseInt(input.year)),
            eq(
              questionTable.questionNumber,
              Number.parseInt(input.questionNumber)
            )
          )
        );
      if (question.length !== 1) throw new Error("Question not found");

      if (!ctx.userId) {
        throw new Error("User not found");
      }

      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user) throw new Error("User not found");

      const userAnswers = await ctx.db
        .select()
        .from(userQuestionAnswerTable)
        .where(
          and(
            eq(userQuestionAnswerTable.userId, user.id),
            eq(userQuestionAnswerTable.questionId, question[0].question.id)
          )
        );

      return userAnswers.map((answer) => ({
        id: answer.id,
        timeTaken: answer.timeTaken,
        mark: answer.mark,
        note: answer.note,
        createdAt: answer.createdAt
      }));
    }),
  getUserAnswersByQuestionId: baseProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Must be logged in");

      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user) throw new Error("User not found");

      const userAnswers = await ctx.db.query.userQuestionAnswerTable.findMany({
        where: and(
          eq(userQuestionAnswerTable.userId, user.id),
          eq(userQuestionAnswerTable.questionId, input.questionId)
        )
      });

      return userAnswers;
    }),
  postUserAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.number(),
        timeTaken: z.number().optional(),
        mark: z.number().optional(),
        note: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user) throw new Error("User not found");

      const userAnswer = await ctx.db
        .insert(userQuestionAnswerTable)
        .values({
          userId: user.id,
          questionId: input.questionId,
          timeTaken: input.timeTaken ?? null,
          mark: input.mark ?? null,
          note: input.note ?? null
        })
        .returning();

      if (userAnswer.length !== 1)
        throw new Error("User answer failed to insert");

      return {
        id: userAnswer[0].id
      };
    }),
  deleteUserAnswer: protectedProcedure
    .input(
      z.object({
        id: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user) throw new Error("User not found");

      await ctx.db
        .delete(userQuestionAnswerTable)
        .where(
          and(
            eq(userQuestionAnswerTable.id, input.id),
            eq(userQuestionAnswerTable.userId, user.id)
          )
        );
    })
});
