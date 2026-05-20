import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { db } from "@/db";
import { courseTable, courseYearTable } from "@/db/schema/course";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import {
  courseInsightTable,
  questionTopicTable,
  topicTable
} from "@/db/schema/topic";
import {
  triposPartTable,
  triposPartYearTable,
  triposTable
} from "@/db/schema/tripos";
import { env } from "@/env";

const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
const openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const index = pinecone.Index("questions", env.PINECONE_HOST);

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_questions",
      {
        title: "Search Questions",
        description:
          "Semantic search over Cambridge Computer Science Tripos exam questions using vector embeddings. Returns questions ranked by relevance to the query.",
        inputSchema: {
          query: z
            .string()
            .describe(
              "Natural language search query, e.g. 'graph algorithms', 'memory management', 'type inference'"
            ),
          limit: z
            .number()
            .min(1)
            .max(20)
            .optional()
            .describe("Maximum number of results to return (default 10)")
        }
      },
      async ({ query, limit }) => {
        const topK = limit ?? 10;

        const vector = await openaiClient.embeddings.create({
          model: "text-embedding-3-small",
          input: query
        });

        const searchResults = await index.query({
          vector: vector.data[0].embedding,
          topK,
          includeMetadata: true,
          includeValues: false
        });

        const matches = searchResults.matches.filter(
          (m) => m.score && m.score > 0.25
        );

        if (matches.length === 0) {
          return {
            content: [
              { type: "text", text: "No matching questions found for that query." }
            ]
          };
        }

        const dbIds = matches
          .map((m) => parseInt(m.id))
          .filter((id) => !isNaN(id));

        const questions = await db
          .select({
            questionId: questionTable.id,
            questionNumber: questionTable.questionNumber,
            paperName: paperTable.name,
            year: paperYearTable.year,
            courseName: courseTable.name,
            minimumMark: questionTable.minimumMark,
            medianMark: questionTable.medianMark,
            maximumMark: questionTable.maximumMark,
            attempts: questionTable.attempts,
            examinerComment: questionTable.examinerComment,
            url: questionTable.url
          })
          .from(questionTable)
          .innerJoin(paperYearTable, eq(questionTable.paperYearId, paperYearTable.id))
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(courseYearTable, eq(questionTable.courseYearId, courseYearTable.id))
          .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(inArray(questionTable.id, dbIds));

        const topicRows = await db
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

        const results = matches
          .map((m) => {
            const q = questions.find((q) => q.questionId === parseInt(m.id));
            if (!q) return null;
            return {
              questionId: q.questionId,
              year: q.year,
              paper: q.paperName,
              questionNumber: q.questionNumber,
              course: q.courseName ?? "Unknown",
              topics: topicsByQuestion.get(q.questionId) ?? [],
              marks: {
                minimum: q.minimumMark,
                median: q.medianMark,
                maximum: q.maximumMark
              },
              attempts: q.attempts,
              examinerComment: q.examinerComment,
              url: q.url,
              similarityScore: m.score,
              extractedText: (m.metadata as Record<string, unknown>)?.text ?? null
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }
    );

    server.registerTool(
      "list_courses",
      {
        title: "List Courses",
        description:
          "List all Cambridge Computer Science Tripos courses. Optionally filter by name.",
        inputSchema: {
          filter: z
            .string()
            .optional()
            .describe(
              "Optional text filter to match against course name or code"
            )
        }
      },
      async ({ filter }) => {
        let courses;
        if (filter) {
          const sanitized = filter.replace(/[%_\\]/g, "\\$&");
          courses = await db
            .select({
              id: courseTable.id,
              name: courseTable.name,
              code: courseTable.code
            })
            .from(courseTable)
            .where(
              or(
                ilike(courseTable.name, `%${sanitized}%`),
                ilike(courseTable.code, `%${sanitized}%`)
              )
            )
            .orderBy(courseTable.name);
        } else {
          courses = await db
            .select({
              id: courseTable.id,
              name: courseTable.name,
              code: courseTable.code
            })
            .from(courseTable)
            .orderBy(courseTable.name);
        }

        return {
          content: [{ type: "text", text: JSON.stringify(courses, null, 2) }]
        };
      }
    );

    server.registerTool(
      "get_course_details",
      {
        title: "Get Course Details",
        description:
          "Get detailed information about a specific course including all years it was taught, questions per year, mark statistics, lecturers, and topics.",
        inputSchema: {
          courseId: z.number().describe("The course ID (from list_courses)")
        }
      },
      async ({ courseId }) => {
        const course = await db.query.courseTable.findFirst({
          where: eq(courseTable.id, courseId)
        });

        if (!course) {
          return {
            content: [{ type: "text", text: "Course not found." }]
          };
        }

        const courseYears = await db.query.courseYearTable.findMany({
          where: eq(courseYearTable.courseId, course.id),
          with: {
            questions: {
              with: {
                paperYear: {
                  with: { paper: true }
                }
              }
            },
            courseYearLecturers: {
              with: { lecturer: true }
            }
          },
          orderBy: (courseYear, { desc }) => [desc(courseYear.year)]
        });

        const topics = await db
          .select({
            id: topicTable.id,
            name: topicTable.name,
            questionCount: count(questionTopicTable.id)
          })
          .from(topicTable)
          .leftJoin(
            questionTopicTable,
            eq(questionTopicTable.topicId, topicTable.id)
          )
          .where(eq(topicTable.courseId, courseId))
          .groupBy(topicTable.id, topicTable.name)
          .orderBy(desc(count(questionTopicTable.id)));

        const insight = await db.query.courseInsightTable.findFirst({
          where: eq(courseInsightTable.courseId, courseId)
        });

        const result = {
          id: course.id,
          name: course.name,
          code: course.code,
          topics: topics.map((t) => ({ name: t.name, questionCount: t.questionCount })),
          insight: insight?.content ?? null,
          years: courseYears.map((cy) => ({
            year: cy.year,
            terms: {
              michaelmas: cy.michaelmas,
              lent: cy.lent,
              easter: cy.easter
            },
            lectures: cy.lectures,
            lecturers: cy.courseYearLecturers.map((l) => ({
              name: l.lecturer?.name,
              crsid: l.lecturer?.crsid
            })),
            questions: cy.questions.map((q) => ({
              id: q.id,
              questionNumber: q.questionNumber,
              paper: q.paperYear?.paper?.name ?? "",
              minimumMark: q.minimumMark,
              medianMark: q.medianMark,
              maximumMark: q.maximumMark,
              attempts: q.attempts
            }))
          }))
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    server.registerTool(
      "get_question",
      {
        title: "Get Question",
        description:
          "Get full details of a specific exam question by paper, year, and question number.",
        inputSchema: {
          paper: z.string().describe("Paper number, e.g. '1', '2', '3'"),
          year: z.number().describe("Exam year, e.g. 2023"),
          questionNumber: z
            .number()
            .describe("Question number within the paper")
        }
      },
      async ({ paper, year, questionNumber }) => {
        const questionResponse = await db
          .select({
            questionId: questionTable.id,
            questionNumber: questionTable.questionNumber,
            url: questionTable.url,
            solutionUrl: questionTable.solutionUrl,
            examinerComment: questionTable.examinerComment,
            minimumMark: questionTable.minimumMark,
            medianMark: questionTable.medianMark,
            maximumMark: questionTable.maximumMark,
            attempts: questionTable.attempts,
            paperName: paperTable.name,
            year: paperYearTable.year,
            courseName: courseTable.name,
            courseCode: courseTable.code,
            triposPartName: triposPartTable.name
          })
          .from(questionTable)
          .innerJoin(paperYearTable, eq(questionTable.paperYearId, paperYearTable.id))
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(
            triposPartYearTable,
            eq(paperYearTable.triposPartYearId, triposPartYearTable.id)
          )
          .leftJoin(
            triposPartTable,
            eq(triposPartYearTable.triposPartId, triposPartTable.id)
          )
          .leftJoin(courseYearTable, eq(questionTable.courseYearId, courseYearTable.id))
          .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(
            and(
              eq(paperTable.name, paper),
              eq(paperYearTable.year, year),
              eq(questionTable.questionNumber, questionNumber)
            )
          );

        if (questionResponse.length === 0) {
          return {
            content: [{ type: "text", text: "Question not found." }]
          };
        }

        const q = questionResponse[0];

        const topicRows = await db
          .select({ topicName: topicTable.name })
          .from(questionTopicTable)
          .innerJoin(topicTable, eq(questionTopicTable.topicId, topicTable.id))
          .where(eq(questionTopicTable.questionId, q.questionId));

        const result = {
          id: q.questionId,
          paper: q.paperName,
          year: q.year,
          questionNumber: q.questionNumber,
          course: q.courseName,
          courseCode: q.courseCode,
          triposPart: q.triposPartName,
          url: q.url,
          solutionUrl: q.solutionUrl,
          examinerComment: q.examinerComment,
          marks: {
            minimum: q.minimumMark,
            median: q.medianMark,
            maximum: q.maximumMark
          },
          attempts: q.attempts,
          topics: topicRows.map((t) => t.topicName)
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    server.registerTool(
      "get_similar_questions",
      {
        title: "Get Similar Questions",
        description:
          "Find questions similar to a given question using vector embeddings. Useful for finding related exam problems across different years.",
        inputSchema: {
          questionId: z
            .number()
            .describe("The question ID to find similar questions for"),
          limit: z
            .number()
            .min(1)
            .max(10)
            .optional()
            .describe("Maximum number of similar questions to return (default 5)")
        }
      },
      async ({ questionId, limit }) => {
        const topK = (limit ?? 5) + 1;

        const fetchResult = await index.fetch({
          ids: [questionId.toString()]
        });
        const record = fetchResult.records[questionId.toString()];
        if (!record || !record.values) {
          return {
            content: [
              {
                type: "text",
                text: "No embedding found for this question. It may not have been indexed yet."
              }
            ]
          };
        }

        const queryResult = await index.query({
          vector: record.values,
          topK,
          includeMetadata: false
        });

        const matches = queryResult.matches
          .filter(
            (m) =>
              m.id !== questionId.toString() &&
              m.score !== undefined &&
              m.score > 0.4
          )
          .slice(0, limit ?? 5);

        if (matches.length === 0) {
          return {
            content: [{ type: "text", text: "No similar questions found." }]
          };
        }

        const dbIds = matches
          .map((m) => parseInt(m.id))
          .filter((id) => !isNaN(id));

        const questions = await db
          .select({
            questionId: questionTable.id,
            questionNumber: questionTable.questionNumber,
            paperName: paperTable.name,
            year: paperYearTable.year,
            courseName: courseTable.name,
            minimumMark: questionTable.minimumMark,
            medianMark: questionTable.medianMark,
            maximumMark: questionTable.maximumMark
          })
          .from(questionTable)
          .innerJoin(paperYearTable, eq(questionTable.paperYearId, paperYearTable.id))
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(courseYearTable, eq(questionTable.courseYearId, courseYearTable.id))
          .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(inArray(questionTable.id, dbIds));

        const results = matches
          .map((m) => {
            const q = questions.find((q) => q.questionId === parseInt(m.id));
            if (!q) return null;
            return {
              questionId: q.questionId,
              year: q.year,
              paper: q.paperName,
              questionNumber: q.questionNumber,
              course: q.courseName ?? "Unknown",
              marks: {
                minimum: q.minimumMark,
                median: q.medianMark,
                maximum: q.maximumMark
              },
              similarityScore: m.score
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      }
    );

    server.registerTool(
      "get_questions_by_topic",
      {
        title: "Get Questions by Topic",
        description:
          "Find all exam questions tagged with a specific topic. Topics are AI-generated tags like 'Graph Algorithms', 'Memory Management', etc.",
        inputSchema: {
          topicName: z
            .string()
            .describe(
              "Topic name to search for (partial match supported), e.g. 'algorithms', 'types'"
            ),
          courseId: z
            .number()
            .optional()
            .describe("Optional course ID to restrict results to a specific course")
        }
      },
      async ({ topicName, courseId }) => {
        const sanitized = topicName.replace(/[%_\\]/g, "\\$&");

        const conditions = [ilike(topicTable.name, `%${sanitized}%`)];
        if (courseId) {
          conditions.push(eq(topicTable.courseId, courseId));
        }

        const topics = await db
          .select({
            topicId: topicTable.id,
            topicName: topicTable.name,
            courseId: topicTable.courseId,
            courseName: courseTable.name
          })
          .from(topicTable)
          .innerJoin(courseTable, eq(topicTable.courseId, courseTable.id))
          .where(and(...conditions));

        if (topics.length === 0) {
          return {
            content: [{ type: "text", text: "No topics matching that name found." }]
          };
        }

        const topicIds = topics.map((t) => t.topicId);

        const questionRows = await db
          .select({
            questionId: questionTable.id,
            questionNumber: questionTable.questionNumber,
            paperName: paperTable.name,
            year: paperYearTable.year,
            courseName: courseTable.name,
            topicId: questionTopicTable.topicId,
            minimumMark: questionTable.minimumMark,
            medianMark: questionTable.medianMark,
            maximumMark: questionTable.maximumMark,
            confidence: questionTopicTable.confidence
          })
          .from(questionTopicTable)
          .innerJoin(
            questionTable,
            eq(questionTopicTable.questionId, questionTable.id)
          )
          .innerJoin(paperYearTable, eq(questionTable.paperYearId, paperYearTable.id))
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(courseYearTable, eq(questionTable.courseYearId, courseYearTable.id))
          .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(inArray(questionTopicTable.topicId, topicIds))
          .limit(50);

        const topicMap = new Map(topics.map((t) => [t.topicId, t]));

        const results = questionRows.map((q) => ({
          questionId: q.questionId,
          year: q.year,
          paper: q.paperName,
          questionNumber: q.questionNumber,
          course: q.courseName ?? "Unknown",
          topic: topicMap.get(q.topicId)?.topicName ?? "",
          confidence: q.confidence,
          marks: {
            minimum: q.minimumMark,
            median: q.medianMark,
            maximum: q.maximumMark
          }
        }));

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      }
    );

    server.registerTool(
      "get_exam_statistics",
      {
        title: "Get Exam Statistics",
        description:
          "Get grade distribution and candidate statistics for a specific Tripos part and year. Includes first-class, upper-second, etc. counts.",
        inputSchema: {
          year: z.number().describe("The exam year"),
          triposPart: z
            .string()
            .optional()
            .describe(
              "Tripos part name filter, e.g. 'Part IA', 'Part IB', 'Part II'"
            )
        }
      },
      async ({ year, triposPart }) => {
        const conditions = [eq(triposPartYearTable.year, year)];

        const rows = await db
          .select({
            year: triposPartYearTable.year,
            triposPartName: triposPartTable.name,
            triposName: triposTable.name,
            candidates: triposPartYearTable.candidates,
            starredFirsts: triposPartYearTable.starredFirsts,
            firsts: triposPartYearTable.firsts,
            twoOnes: triposPartYearTable.twoOnes,
            twoTwos: triposPartYearTable.twoTwos,
            thirds: triposPartYearTable.thirds,
            unclassed: triposPartYearTable.unclassed,
            withdrawn: triposPartYearTable.withdrawn
          })
          .from(triposPartYearTable)
          .innerJoin(
            triposPartTable,
            eq(triposPartYearTable.triposPartId, triposPartTable.id)
          )
          .innerJoin(triposTable, eq(triposPartTable.triposId, triposTable.id))
          .where(and(...conditions));

        const filtered = triposPart
          ? rows.filter((r) =>
              r.triposPartName.toLowerCase().includes(triposPart.toLowerCase())
            )
          : rows;

        if (filtered.length === 0) {
          return {
            content: [
              { type: "text", text: "No statistics found for that year/part." }
            ]
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }]
        };
      }
    );

    server.registerTool(
      "list_papers",
      {
        title: "List Papers",
        description:
          "List all exam papers available for a given year, or list all years available for a given paper number.",
        inputSchema: {
          year: z.number().optional().describe("Filter by exam year"),
          paperNumber: z
            .string()
            .optional()
            .describe("Filter by paper number, e.g. '1', '2'")
        }
      },
      async ({ year, paperNumber }) => {
        const conditions = [];
        if (year) conditions.push(eq(paperYearTable.year, year));
        if (paperNumber) conditions.push(eq(paperTable.name, paperNumber));

        const papers = await db
          .select({
            paperId: paperTable.id,
            paperName: paperTable.name,
            year: paperYearTable.year,
            triposPartName: triposPartTable.name,
            url: paperYearTable.url
          })
          .from(paperYearTable)
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(
            triposPartYearTable,
            eq(paperYearTable.triposPartYearId, triposPartYearTable.id)
          )
          .leftJoin(
            triposPartTable,
            eq(triposPartYearTable.triposPartId, triposPartTable.id)
          )
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(paperYearTable.year), paperTable.name)
          .limit(50);

        return {
          content: [{ type: "text", text: JSON.stringify(papers, null, 2) }]
        };
      }
    );
  },
  {
    capabilities: {
      tools: {}
    }
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60
  }
);

export { handler as GET, handler as POST, handler as DELETE };
