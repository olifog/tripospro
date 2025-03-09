import { triposPartTable } from "@/db/schema/tripos";
import { usersTable } from "@/db/schema/user";
import { userQuestionAnswerTable } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { baseProcedure } from "../init";
import { createTRPCRouter } from "../init";

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

      const questions = await ctx.db.query.triposPartTable.findMany({
        where: eq(triposPartTable.code, input.part),
        with: {
          triposPartYears: {
            with: {
              paperYears: {
                with: {
                  paper: true,
                  questions: {
                    with: {
                      userQuestionAnswers: {
                        where: eq(userQuestionAnswerTable.userId, user?.id ?? 0)
                      }
                    }
                  },
                  courseYears: {
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
      if (questions.length !== 1) throw new Error("Invalid part");
      const response = questions[0];

      return {
        years: response.triposPartYears.map((year) => ({
          year: year.year,
          triposPartYearId: year.id,
          papers: year.paperYears.map((paper) => ({
            paperId: paper.paperId,
            paperName: paper.paper?.name,
            courses: paper.courseYears.map((course) => ({
              courseId: course.courseId,
              courseYearId: course.id,
              courseName: course.course?.name,
              courseCode: course.course?.code
            })),
            questions: paper.questions.map((question) => ({
              questionId: question.id,
              number: question.questionNumber,
              courseYearId: question.courseYearId,
              answers: question.userQuestionAnswers.length || undefined
            }))
          }))
        }))
      };
    })
});
