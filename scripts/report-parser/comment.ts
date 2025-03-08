import fs from "node:fs";
import { db } from "@/db";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { env } from "@/env";
import { LlamaParseReader } from "@llamaindex/cloud/reader";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { model } from ".";

const reader = new LlamaParseReader({
  apiKey: env.LLAMA_CLOUD_API_KEY,
  resultType: "text",
  maxTimeout: 10000
});

const outputSchema = z.object({
  comments: z.record(z.string(), z.record(z.string(), z.string()))
});

export const digestComments = async (commentsUrl: string) => {
  const commentsPdf = await fetch(commentsUrl);

  const file = new File([await commentsPdf.blob()], "comments.pdf", {
    type: "application/pdf"
  });
  const fileBuffer = await file.arrayBuffer();
  fs.writeFileSync("/tmp/comments.pdf", Buffer.from(fileBuffer));

  const comments = await reader.loadData("/tmp/comments.pdf");

  const jsonOutput = comments.map((doc) => doc.toJSON());

  const result = await generateObject({
    model,
    schema: outputSchema,
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that extracts examiner feedback comments from a pdf.

        The pdf will be split into sections for each question number (with the associated course name),
        under overarching paper numbers.

        You must output a json object with the following format:
        {
          "comments": {
            [paperNumber: string]: {
              [questionNumber: string]: <comment: string>
            }
          }
        }

        The paper number should JUST be the paper number, without any other text. e.g. "1" instead of "Part IA Paper 1".

        Be careful not to interpret the page number as the paper number. Each paper generally has around 10 questions,
        and all the papers will be ordered sequentially in order (with questions ordered within each paper).
        `
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the examiner feedback comments from the following document."
          },
          {
            type: "text",
            text: JSON.stringify(jsonOutput, null, 2)
          }
        ]
      }
    ]
  });

  return result.object.comments;
};

export const uploadComments = async (
  year: string,
  commentsOutput: z.infer<typeof outputSchema>["comments"]
) => {
  console.log("Uploading comments...");
  for (const [paperNumber, questions] of Object.entries(commentsOutput)) {
    const paper = await db.query.paperTable.findFirst({
      where: eq(paperTable.name, paperNumber)
    });

    if (!paper) {
      console.error(`Paper ${paperNumber} not found`);
      continue;
    }

    const paperYear = await db.query.paperYearTable.findFirst({
      where: and(
        eq(paperYearTable.paperId, paper.id),
        eq(paperYearTable.year, Number.parseInt(year))
      )
    });

    if (!paperYear) {
      console.error(`Paper year ${paperNumber} ${year} not found`);
      continue;
    }

    for (const [questionNumber, comment] of Object.entries(questions)) {
      await db
        .update(questionTable)
        .set({
          examinerComment: comment
        })
        .where(
          and(
            eq(questionTable.paperYearId, paperYear.id),
            eq(questionTable.questionNumber, Number.parseInt(questionNumber))
          )
        );
    }
  }
};
