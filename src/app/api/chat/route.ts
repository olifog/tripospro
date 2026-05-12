import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage
} from "ai";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "@/db";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { env } from "@/env";

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

const index = pinecone.Index("questions", env.PINECONE_HOST);

export const maxDuration = 30;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai("gpt-5.5"),
    system: `You are an assistant to students studying Computer Science at Cambridge University.
      Your main purpose is to help in revision for exams, and to aid in suggesting past paper
      questions to complete. You have a knowledge base of past papers and questions, and can
      suggest similar questions to the user. You should also look up to see if certain things
      have been asked, and how often. Use tools if useful, and try and recommend relevant questions to queries
      as much as possible - it's helpful! Questions MUST be recommended using the \`returnQuestions\` tool, and
      in addition to calling this tool you should reply to the user with a summary message answering their query
      and why the questions are relevant.
      Try and reword the user's query as much as possible to be an accurate semantic search query for the vector database, to maximise
      how useful the returned questions will be for the user's revision.

      You also have access to \`getQuestionDetails\` to look up specific question metadata (marks, attempts, examiner comments).
      Use it when a user asks about a specific question or wants to know how hard a question is.

      If anyone asks, your favourite course is IA Databases. You LOVE DynamoDB in particular. Your favourite related question is 2024 IA Databases Paper 3 Question 2.`,
    messages: await convertToModelMessages(messages),
    tools: {
      queryVectorDatabase: tool({
        description:
          "Query the vector database for past paper questions by semantic similarity.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              "The semantic search query. Reword the user's question to be an effective search query."
            ),
          year: z
            .number()
            .optional()
            .describe("Optional year to filter results by.")
        }),
        execute: async ({ query, year }) => {
          const vector = await openaiClient.embeddings.create({
            model: "text-embedding-3-small",
            input: query
          });

          const results = await index.query({
            vector: vector.data[0].embedding,
            topK: 15,
            includeMetadata: true,
            includeValues: false,
            ...(year ? { filter: { year: { $eq: year } } } : {})
          });

          return results.matches.map((match) => ({
            data: match.metadata,
            score: match.score,
            id: match.id
          }));
        }
      }),
      getQuestionDetails: tool({
        description:
          "Get detailed metadata for a specific question by paper number, year, and question number. Returns mark statistics, attempts, and examiner comments.",
        inputSchema: z.object({
          paperNumber: z.string().describe("The paper number, e.g. '3'"),
          year: z.number().describe("The exam year, e.g. 2024"),
          questionNumber: z
            .number()
            .describe("The question number within the paper, e.g. 2")
        }),
        execute: async ({ paperNumber, year, questionNumber }) => {
          const paper = await db.query.paperTable.findFirst({
            where: eq(paperTable.name, paperNumber)
          });
          if (!paper) return { error: "Paper not found" };

          const paperYear = await db.query.paperYearTable.findFirst({
            where: and(
              eq(paperYearTable.paperId, paper.id),
              eq(paperYearTable.year, year)
            ),
            with: { triposPartYear: { with: { triposPart: true } } }
          });
          if (!paperYear) return { error: "Paper year not found" };

          const question = await db.query.questionTable.findFirst({
            where: and(
              eq(questionTable.paperYearId, paperYear.id),
              eq(questionTable.questionNumber, questionNumber)
            ),
            with: { courseYear: { with: { course: true } } }
          });
          if (!question) return { error: "Question not found" };

          return {
            id: question.id,
            year,
            paperNumber,
            questionNumber,
            courseName: question.courseYear?.course?.name ?? "Unknown",
            courseCode: question.courseYear?.course?.code ?? "Unknown",
            triposPart: paperYear.triposPartYear?.triposPart?.name ?? "Unknown",
            attempts: question.attempts,
            minimumMark: question.minimumMark,
            maximumMark: question.maximumMark,
            medianMark: question.medianMark,
            examinerComment: question.examinerComment,
            candidates: paperYear.triposPartYear?.candidates
          };
        }
      }),
      returnQuestions: tool({
        description:
          "Display past paper question cards to the user. Call this after queryVectorDatabase to show results visually.",
        inputSchema: z.object({
          questionIds: z
            .array(z.string())
            .describe("The question IDs to display as interactive cards.")
        })
      })
    },
    stopWhen: stepCountIs(5),
    onError: (error) => {
      console.error("Stream error:", error);
    }
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred";
    }
  });
}
