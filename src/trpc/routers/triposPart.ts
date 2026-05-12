import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";
import {
  userQuestionAnswerTable,
  userQuestionFlagTable,
  usersTable
} from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";

export const triposPartRouter = createTRPCRouter({
  getQuestions: baseProcedure
    .input(z.object({ part: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await (async () => {
        if (!ctx.userId) return null;
        const user = await ctx.db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, ctx.userId)
        });
        if (!user) throw new Error("User not found");
        return user;
      })();

      const triposPart = await ctx.db.query.triposPartTable.findFirst({
        where: eq(triposPartTable.code, input.part)
      });
      if (!triposPart) throw new Error(`Tripos part "${input.part}" not found`);

      const triposPartYears = await ctx.db.query.triposPartYearTable.findMany({
        where: eq(triposPartYearTable.triposPartId, triposPart.id),
        with: {
          paperYears: {
            with: {
              paper: true,
              questions: {
                with: {
                  userQuestionAnswers: {
                    where: eq(userQuestionAnswerTable.userId, user?.id ?? 0)
                  },
                  userQuestionFlags: {
                    where: eq(userQuestionFlagTable.userId, user?.id ?? 0)
                  }
                }
              },
              courseYearPaperYears: {
                with: {
                  courseYear: {
                    with: {
                      course: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return {
        years: triposPartYears.map((year) => ({
          year: year.year,
          triposPartYearId: year.id,
          papers: year.paperYears.map((paper) => ({
            paperId: paper.paperId,
            paperName: paper.paper?.name,
            courses: paper.courseYearPaperYears.map((course) => ({
              courseId: course.courseYear?.courseId,
              courseYearId: course.courseYear?.id,
              courseName: course.courseYear?.course?.name,
              courseCode: course.courseYear?.course?.code
            })),
            questions: paper.questions.map((question) => {
              const answers = question.userQuestionAnswers;
              const marksWithValues = answers
                .map((a) => a.mark)
                .filter((m): m is number => m !== null);
              const bestMark = marksWithValues.length > 0
                ? Math.max(...marksWithValues)
                : undefined;
              return {
                questionId: question.id,
                number: question.questionNumber,
                courseYearId: question.courseYearId,
                answers: answers.length || undefined,
                bestMark,
                flagged: question.userQuestionFlags.length > 0
              };
            })
          }))
        }))
      };
    })
});
