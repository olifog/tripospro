import { generateObject } from "ai";

import type { questionTable } from "@/db/schema/question";
import { env } from "@/env";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { embed } from "ai";
import { z } from "zod";

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});
const index = pc.index("questions");

const bedrock = createAmazonBedrock({
  region: "eu-west-2"
});

const model = bedrock("anthropic.claude-sonnet-4-6");

const resultSchema = z.object({
  text: z.string()
});

const translateQuestion = async (pdfBuffer: Buffer) => {
  let tries = 0;

  while (tries < 3) {
    try {
      const response = await generateObject({
        model,
        schema: resultSchema,
        system: `You are a helpful assistant that turns PDFs of Cambridge Computer Science exam questions into a text format.
    You should output the text in clean markdown format, including any LaTeX formulas within $$ delimiters.

    You can ignore any images, diagrams, or other non-text content, and instead write a short description of these when appropriate.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the text from the following PDF document."
              },
              {
                type: "file",
                data: pdfBuffer,
                mediaType: "application/pdf"
              }
            ]
          }
        ]
      });

      return response.object;
    } catch (error) {
      console.error(error);
    }

    tries++;
  }

  throw new Error("Failed to translate question");
};

export const uploadQuestionToVectorDb = async (
  question: typeof questionTable.$inferSelect
) => {
  const pdf = await fetch(question.url);
  const pdfBuffer = Buffer.from(await pdf.arrayBuffer());

  const result = await translateQuestion(pdfBuffer);

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: result.text
  });

  await index.upsert({
    records: [
      {
        id: question.id.toString(),
        values: embedding as number[],
        metadata: {
          text: result.text
        }
      }
    ]
  });

  console.log(`Uploaded question ${question.id} to vector db`);
};
