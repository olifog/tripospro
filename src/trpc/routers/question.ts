import { paperYearTable } from "@/db/schema/paper";
import { paperTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { baseProcedure } from "../init";
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
          questionTable,
          eq(paperYearTable.id, questionTable.paperYearId)
        )
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

      if (ctx.userId) {
        return question;
      }

      return {
        id: question.id,
        paperYearId: question.paperYearId,
        courseYearId: question.courseYearId,
        questionNumber: question.questionNumber,
        url: question.url,
        solutionUrl: question.solutionUrl,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      };
    })
});
