import { openai } from "@ai-sdk/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { embed, generateObject } from "ai";
import { fromBuffer } from "pdf2pic";
import type { BufferResponse } from "pdf2pic/dist/types/convertResponse";
import { z } from "zod";
import type { questionTable } from "@/db/schema/question";
import { env } from "@/env";

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});
const index = pc.index("questions");

const model = openai("gpt-4o-mini");

const resultSchema = z.object({
  text: z.string()
});

const translateQuestion = async (images: BufferResponse[]) => {
  let tries = 0;

  while (tries < 3) {
    try {
      const response = await generateObject({
        model,
        schema: resultSchema,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that turns pdf images of Cambridge Computer Science exam questions into a text format.
    You should output the text in clean markdown format, including any LaTeX formulas within $$ delimiters.

    You can ignore any images, diagrams, or other non-text content, and instead write a short description of these when appropriate.
    `
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the text from the following images of the document."
              },
              ...images.reduce<{ type: "image"; image: Buffer }[]>(
                (acc, image) => {
                  if (image.buffer) {
                    acc.push({ type: "image", image: image.buffer });
                  }
                  return acc;
                },
                []
              )
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
  const pdfBlob = await pdf.blob();
  const pdfBuffer = await pdfBlob.arrayBuffer();

  const convert = fromBuffer(Buffer.from(pdfBuffer), {
    format: "png",
    width: undefined,
    height: undefined,
    density: 150,
    quality: 100
  });

  const images = await convert.bulk(-1, {
    responseType: "buffer"
  });

  const result = await translateQuestion(images);

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: result.text
  });

  await index.upsert([
    {
      id: question.id.toString(),
      values: embedding,
      metadata: {
        text: result.text
      }
    }
  ]);

  console.log(`Uploaded question ${question.id} to vector db`);
};
