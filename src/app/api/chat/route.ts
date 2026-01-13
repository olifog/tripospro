import { openai } from "@ai-sdk/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage
} from "ai";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/env";

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

const index = pinecone.Index("questions", env.PINECONE_HOST);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai("gpt-5.2"),
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
      
      If anyone asks, your favourite course is IA Databases. You LOVE DynamoDB in particular. Your favourite related question is 2024 IA Databases Paper 3 Question 2.`,
    messages: await convertToModelMessages(messages),
    tools: {
      queryVectorDatabase: tool({
        description: "Query the vector database for past paper questions.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("The query to search the vector database with.")
        }),
        execute: async ({ query }) => {
          console.log("queryVectorDatabase", query);
          const vector = await openaiClient.embeddings.create({
            model: "text-embedding-3-small",
            input: query
          });

          const results = await index.query({
            vector: vector.data[0].embedding,
            topK: 15,
            includeMetadata: true,
            includeValues: false
          });

          return results.matches.map((match) => ({
            data: match.metadata,
            score: match.score,
            id: match.id
          }));
        }
      }),
      returnQuestions: tool({
        description: "Return and display past paper questions to the user.",
        inputSchema: z.object({
          questionIds: z
            .array(z.string())
            .describe("The question ids to display.")
        })
        // No execute - this is a client-side tool for displaying UI
      })
    },
    // Enable multi-step calls so the model can:
    // 1. Call queryVectorDatabase
    // 2. Then call returnQuestions with the results
    // 3. Then provide a summary response
    stopWhen: stepCountIs(5),
    onError: (error) => {
      console.error("Stream error:", error);
    }
  });

  return result.toUIMessageStreamResponse({
    // Surface tool errors to the client for debugging
    onError: (error) => {
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred";
    }
  });
}
