import { Pinecone } from "@pinecone-database/pinecone";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { courseTable, courseYearTable } from "@/db/schema/course";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionAuthorTable, questionTable } from "@/db/schema/question";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";
import {
  userQuestionAnswerTable,
  userQuestionFlagTable,
  usersTable
} from "@/db/schema/user";
import { env } from "@/env";
import { calendarYearToAcademicYear } from "@/lib/utils";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
const index = pinecone.Index("questions", env.PINECONE_HOST);

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
            eq(paperYearTable.year, Number.parseInt(input.year, 10)),
            eq(
              questionTable.questionNumber,
              Number.parseInt(input.questionNumber, 10)
            )
          )
        );

      if (questionResponse.length !== 1) throw new Error("Question not found");

      const question = questionResponse[0].question;
      if (!question) throw new Error("Question not found");

      const courseName = questionResponse[0].course?.name ?? "";
      const courseId = questionResponse[0].course?.id;
      const courseCode = questionResponse[0].course?.code ?? "";
      const courseYearNum = questionResponse[0].course_year?.year;
      const courseUrl =
        courseCode && courseYearNum
          ? `https://www.cl.cam.ac.uk/teaching/${calendarYearToAcademicYear(courseYearNum - 1)}/${courseCode}`
          : "";
      const paperCandidates =
        questionResponse[0].tripos_part_year?.candidates ?? 0;
      const triposPartCode = questionResponse[0].tripos_part?.code;
      const triposPartName = questionResponse[0].tripos_part?.name;

      const authors = await ctx.db
        .select({
          crsid: usersTable.crsid,
          name: usersTable.name
        })
        .from(questionAuthorTable)
        .innerJoin(usersTable, eq(questionAuthorTable.authorId, usersTable.id))
        .where(eq(questionAuthorTable.questionId, question.id));

      if (ctx.userId) {
        return {
          ...question,
          courseName,
          courseId,
          courseUrl,
          paperCandidates,
          triposPartCode,
          triposPartName,
          authors
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
        courseUrl,
        triposPartCode,
        triposPartName,
        authors
      };
    }),
  getQuestionCourse: baseProcedure
    .input(
      z.object({
        paperNumber: z.string(),
        year: z.string(),
        questionNumber: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await (async () => {
        if (!ctx.userId) return null;
        const user = await ctx.db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, ctx.userId)
        });
        if (!user) throw new Error("User not found");
        return user;
      })();

      const question = await ctx.db
        .select()
        .from(paperTable)
        .leftJoin(paperYearTable, eq(paperTable.id, paperYearTable.paperId))
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
            eq(paperYearTable.year, Number.parseInt(input.year, 10)),
            eq(
              questionTable.questionNumber,
              Number.parseInt(input.questionNumber, 10)
            )
          )
        );
      if (question.length !== 1) throw new Error("Question not found");

      const course = question[0].course;
      if (!course) throw new Error("Course not found");

      // get all questions for the course, grouped by courseYear
      const courseYears = await ctx.db.query.courseYearTable.findMany({
        where: eq(courseYearTable.courseId, course.id),
        with: {
          questions: {
            with: {
              paperYear: {
                with: {
                  paper: true
                }
              },
              userQuestionAnswers: {
                where: eq(userQuestionAnswerTable.userId, user?.id ?? 0)
              },
              userQuestionFlags: {
                where: eq(userQuestionFlagTable.userId, user?.id ?? 0)
              }
            }
          }
        }
      });

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        years: courseYears.map((year) => ({
          year: year.year,
          questions: year.questions.map((question) => {
            const answers = question.userQuestionAnswers;
            const marksWithValues = answers
              .map((a) => a.mark)
              .filter((m): m is number => m !== null);
            const bestMark =
              marksWithValues.length > 0
                ? Math.max(...marksWithValues)
                : undefined;
            return {
              questionNumber: question.questionNumber,
              paperName: question.paperYear?.paper?.name ?? "",
              answers: answers.length || undefined,
              bestMark,
              flagged: question.userQuestionFlags.length > 0
            };
          })
        }))
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
  getUserAnswers: protectedProcedure
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
            eq(paperYearTable.year, Number.parseInt(input.year, 10)),
            eq(
              questionTable.questionNumber,
              Number.parseInt(input.questionNumber, 10)
            )
          )
        );
      if (question.length !== 1) throw new Error("Question not found");

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
  getUserAnswersByQuestionId: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
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
    }),
  toggleFlag: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user) throw new Error("User not found");

      const existing = await ctx.db.query.userQuestionFlagTable.findFirst({
        where: and(
          eq(userQuestionFlagTable.userId, user.id),
          eq(userQuestionFlagTable.questionId, input.questionId)
        )
      });

      if (existing) {
        await ctx.db
          .delete(userQuestionFlagTable)
          .where(eq(userQuestionFlagTable.id, existing.id));
        return { flagged: false };
      }

      await ctx.db.insert(userQuestionFlagTable).values({
        userId: user.id,
        questionId: input.questionId
      });
      return { flagged: true };
    }),
  getFlag: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });
      if (!user) throw new Error("User not found");

      const flag = await ctx.db.query.userQuestionFlagTable.findFirst({
        where: and(
          eq(userQuestionFlagTable.userId, user.id),
          eq(userQuestionFlagTable.questionId, input.questionId)
        )
      });
      return { flagged: !!flag };
    }),
  getSimilarQuestions: baseProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const fetchResult = await index.fetch({
        ids: [input.questionId.toString()]
      });
      const record = fetchResult.records[input.questionId.toString()];
      if (!record || !record.values) {
        return [];
      }

      const queryResult = await index.query({
        vector: record.values,
        topK: 6,
        includeMetadata: false
      });

      const matches = queryResult.matches
        .filter(
          (m) =>
            m.id !== input.questionId.toString() &&
            m.score !== undefined &&
            m.score > 0.5
        )
        .slice(0, 5);

      if (matches.length === 0) return [];

      const dbIds = matches
        .map((m) => parseInt(m.id))
        .filter((id) => !isNaN(id));

      if (dbIds.length === 0) return [];

      const questions = await ctx.db
        .select({
          questionId: questionTable.id,
          questionNumber: questionTable.questionNumber,
          paperName: paperTable.name,
          year: paperYearTable.year,
          courseName: courseTable.name,
          courseId: courseTable.id,
          minimumMark: questionTable.minimumMark,
          medianMark: questionTable.medianMark,
          maximumMark: questionTable.maximumMark
        })
        .from(questionTable)
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
        .where(inArray(questionTable.id, dbIds));

      // Fetch topics for these questions
      const { questionTopicTable, topicTable } = await import("@/db/schema/topic");
      const topicRows = await ctx.db
        .select({
          questionId: questionTopicTable.questionId,
          topicName: topicTable.name
        })
        .from(questionTopicTable)
        .innerJoin(topicTable, eq(questionTopicTable.topicId, topicTable.id))
        .where(inArray(questionTopicTable.questionId, dbIds));

      const topicsByQuestion = new Map<number, string[]>();
      for (const row of topicRows) {
        if (!topicsByQuestion.has(row.questionId)) {
          topicsByQuestion.set(row.questionId, []);
        }
        topicsByQuestion.get(row.questionId)!.push(row.topicName);
      }

      // Fetch user's best marks if logged in
      let userBestMarks = new Map<number, number>();
      if (ctx.userId) {
        const user = await ctx.db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, ctx.userId)
        });
        if (user) {
          const answers = await ctx.db
            .select({
              questionId: userQuestionAnswerTable.questionId,
              mark: userQuestionAnswerTable.mark
            })
            .from(userQuestionAnswerTable)
            .where(
              and(
                eq(userQuestionAnswerTable.userId, user.id),
                inArray(userQuestionAnswerTable.questionId, dbIds)
              )
            );
          for (const a of answers) {
            if (a.mark !== null && a.questionId !== null) {
              const current = userBestMarks.get(a.questionId) ?? -1;
              if (a.mark > current) userBestMarks.set(a.questionId, a.mark);
            }
          }
        }
      }

      return matches
        .map((m) => {
          const q = questions.find((q) => q.questionId === parseInt(m.id));
          if (!q) return null;
          return {
            questionId: q.questionId,
            year: q.year,
            paperName: q.paperName,
            questionNumber: q.questionNumber,
            courseName: q.courseName ?? "",
            courseId: q.courseId ?? null,
            minimumMark: q.minimumMark,
            medianMark: q.medianMark,
            maximumMark: q.maximumMark,
            topics: topicsByQuestion.get(q.questionId)?.slice(0, 2) ?? [],
            bestMark: userBestMarks.get(q.questionId) ?? null,
            score: m.score!
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
    })
});
