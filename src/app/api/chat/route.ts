import { Pinecone } from "@pinecone-database/pinecone";

import OpenAI from "openai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const index = pinecone.Index(
  "questions",
  "https://questions-tjzg7l4.svc.apu-57e2-42f6.pinecone.io"
);

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are an assistant to students studying Computer Science at Cambridge University.
      Your main purpose is to help in revision for exams, and to aid in suggesting past paper
      questions to complete. You have a knowledge base of past papers and questions, and can
      suggest similar questions to the user. You should also look up to see if certain things
      have been asked, and how often. Use tools if useful, and try and recommend relevant questions to queries
      as much as possible - it's helpful! Questions MUST be recommended using the \`returnQuestions\` tool, and
      in addition to calling this tool you should reply to the user with a summary message answering their query 
      and why the questions are relevant.
      Try and reword the user's query as much as possible to be an accurate semantic search query for the vector database, to maximise
      how useful the returned questions will be for the user's revision.`,
    messages,
    tools: {
      queryVectorDatabase: {
        description: "Query the vector database for past paper questions.",
        parameters: z.object({
          query: z
            .string()
            .describe("The query to search the vector database with."),
          year: z
            .number()
            .optional()
            .describe("The (optional) year to filter by."),
        }),
        execute: async ({ query, year }: { query: string; year?: number }) => {
          console.log("queryVectorDatabase", query, year);
          const vector = await openaiClient.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
          });

          const results = await index.namespace("questions").query({
            vector: vector.data[0].embedding,
            topK: 10,
            includeMetadata: true,
            includeValues: false,
          });

          return results.matches.map((match) => ({
            data: match.metadata,
            score: match.score,
            id: match.id,
          }));
        },
      },
      getTriposPart: {
        description: "Get the user tripos part.",
        parameters: z.object({}),
      },
      returnQuestions: {
        description: "Return and display past paper questions to the user.",
        parameters: z.object({
          questionIds: z
            .array(z.string())
            .describe("The question ids to display."),
        }),
      },
    },
  });

  return result.toDataStreamResponse();
}
