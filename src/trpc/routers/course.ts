import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { courseTable, courseYearTable } from "@/db/schema/course";
import { triposPartYearTable } from "@/db/schema/tripos";
import { userQuestionAnswerTable, usersTable } from "@/db/schema/user";
import { calendarYearToAcademicYear } from "@/lib/utils";
import { baseProcedure, createTRPCRouter } from "../init";

export const courseRouter = createTRPCRouter({
  getCourse: baseProcedure
    .input(
      z.object({
        courseId: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.query.courseTable.findFirst({
        where: eq(courseTable.id, input.courseId)
      });

      if (!course) throw new Error("Course not found");

      // Get global current year from tripos part years
      const latestTriposPartYear = await ctx.db
        .select({ year: triposPartYearTable.year })
        .from(triposPartYearTable)
        .orderBy(desc(triposPartYearTable.year))
        .limit(1);

      const globalCurrentYear = latestTriposPartYear[0]?.year ?? null;

      const user = await (async () => {
        if (!ctx.userId) return null;
        const user = await ctx.db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, ctx.userId)
        });
        return user ?? null;
      })();

      // Get all course years with their data
      const courseYears = await ctx.db.query.courseYearTable.findMany({
        where: eq(courseYearTable.courseId, course.id),
        with: {
          questions: {
            with: {
              paperYear: {
                with: {
                  paper: true,
                  triposPartYear: true
                }
              },
              userQuestionAnswers: user
                ? {
                    where: eq(userQuestionAnswerTable.userId, user.id)
                  }
                : undefined
            }
          },
          courseYearLecturers: {
            with: {
              lecturer: true
            }
          }
        },
        orderBy: (courseYear, { desc }) => [desc(courseYear.year)]
      });

      // Process the data for the course page
      const years = courseYears.map((cy) => {
        // Calculate marks statistics for this year
        const questionsWithMarks = cy.questions.filter(
          (q) =>
            q.minimumMark !== null &&
            q.maximumMark !== null &&
            q.medianMark !== null
        );

        const marksStats =
          questionsWithMarks.length > 0
            ? {
                minMark: Math.min(
                  ...questionsWithMarks.map((q) => q.minimumMark!)
                ),
                maxMark: Math.max(
                  ...questionsWithMarks.map((q) => q.maximumMark!)
                ),
                avgMinMark:
                  questionsWithMarks.reduce((a, q) => a + q.minimumMark!, 0) /
                  questionsWithMarks.length,
                avgMaxMark:
                  questionsWithMarks.reduce((a, q) => a + q.maximumMark!, 0) /
                  questionsWithMarks.length,
                avgMedianMark:
                  questionsWithMarks.reduce((a, q) => a + q.medianMark!, 0) /
                  questionsWithMarks.length
              }
            : null;

        // Calculate popularity (% of students attempting this course's questions)
        // We need both attempts and candidates to compute this
        const questionsWithAttempts = cy.questions.filter(
          (q) =>
            q.attempts !== null &&
            q.paperYear?.triposPartYear?.candidates !== null &&
            q.paperYear?.triposPartYear?.candidates !== undefined &&
            q.paperYear.triposPartYear.candidates > 0
        );

        let popularity: number | null = null;
        if (questionsWithAttempts.length > 0) {
          // Average the percentage across all questions for this course year
          const totalPercentage = questionsWithAttempts.reduce((sum, q) => {
            const attempts = q.attempts!;
            const candidates = q.paperYear!.triposPartYear!.candidates!;
            return sum + (attempts / candidates) * 100;
          }, 0);
          popularity = totalPercentage / questionsWithAttempts.length;
        }

        return {
          year: cy.year,
          url: `https://www.cl.cam.ac.uk/teaching/${calendarYearToAcademicYear(cy.year - 1)}/${course.code}`,
          michaelmas: cy.michaelmas,
          lent: cy.lent,
          easter: cy.easter,
          lectures: cy.lectures,
          suggestedSupervisions: cy.suggestedSupervisions,
          format: cy.format,
          lecturers: cy.courseYearLecturers.map((cyl) => ({
            id: cyl.lecturer?.id,
            name: cyl.lecturer?.name,
            crsid: cyl.lecturer?.crsid
          })),
          questions: cy.questions.map((q) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            paperName: q.paperYear?.paper?.name ?? "",
            year: q.paperYear?.year ?? cy.year,
            minimumMark: q.minimumMark,
            maximumMark: q.maximumMark,
            medianMark: q.medianMark,
            attempts: q.attempts,
            userAnswers: q.userQuestionAnswers?.length ?? 0
          })),
          marksStats,
          popularity
        };
      });

      // Calculate overall course statistics
      const allMarksStats = years.filter((y) => y.marksStats !== null);
      const overallStats =
        allMarksStats.length > 0
          ? {
              avgMinMark:
                allMarksStats.reduce(
                  (a, y) => a + y.marksStats!.avgMinMark,
                  0
                ) / allMarksStats.length,
              avgMaxMark:
                allMarksStats.reduce(
                  (a, y) => a + y.marksStats!.avgMaxMark,
                  0
                ) / allMarksStats.length,
              avgMedianMark:
                allMarksStats.reduce(
                  (a, y) => a + y.marksStats!.avgMedianMark,
                  0
                ) / allMarksStats.length
            }
          : null;

      // Get unique lecturers across all years
      const allLecturers = new Map<
        number,
        {
          id: number;
          name: string | null;
          crsid: string | null;
          years: number[];
        }
      >();
      for (const year of years) {
        for (const lecturer of year.lecturers) {
          if (lecturer.id) {
            if (allLecturers.has(lecturer.id)) {
              allLecturers.get(lecturer.id)!.years.push(year.year);
            } else {
              allLecturers.set(lecturer.id, {
                id: lecturer.id,
                name: lecturer.name ?? null,
                crsid: lecturer.crsid ?? null,
                years: [year.year]
              });
            }
          }
        }
      }

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        years,
        overallStats,
        globalCurrentYear,
        lecturers: Array.from(allLecturers.values()).sort(
          (a, b) => Math.max(...b.years) - Math.max(...a.years)
        )
      };
    })
});
