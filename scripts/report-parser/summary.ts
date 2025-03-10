import { db } from "@/db";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { model } from ".";

import { fromBuffer } from "pdf2pic";

const outputSchema = z.object({
  results: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({
        attempts: z.string().optional(),
        min: z.string().optional(),
        max: z.string().optional(),
        median: z.string().optional()
      })
    )
  )
});

export const digestSummary = async (summaryUrl: string) => {
  console.log("Digesting summary...");
  console.log(summaryUrl);
  const summaryPdf = await fetch(summaryUrl);
  console.log(summaryPdf.status);
  const blob = await summaryPdf.blob();
  const fileBuffer = await blob.arrayBuffer();

  const convert = fromBuffer(Buffer.from(fileBuffer), {
    format: "png",
    width: undefined,
    height: undefined,
    density: 150,
    quality: 100
  });

  const images = await convert.bulk(-1, {
    responseType: "buffer"
  });

  console.log("Images:", images.length);

  const result = await generateObject({
    model,
    schema: outputSchema,
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that extracts exam statistics from a Summary PDF for Cambridge Computer Science.
        
        The pdf will have a table of results per-question for each paper, listed vertically, sometimes with multiple
        papers per page. The questions will be listed downwards vertically under each paper, with question numbers increasing
        from one (though the question numbers are not always present, and should be inferred in these instances.)

        You must output a json object with the following format:
        {
          "results": {
            [paperNumber: string]: {
              [questionNumber: string]: {
                attempts?: <string>,
                min?: <string>,
                max?: <string>,
                median?: <string>,
              }
            }
          }
        }

        The paper number should JUST be the paper number, without any other text. e.g. "1" instead of "Part IA Paper 1".
        The question number should be the question number, without any other text. e.g. "1" instead of "Question 1".
        If there are multiple different tables for the same paper, e.g. Part II (50%) and Part IB both having a
        Paper 7 table, you should aggregate the results into a single "7" table.
        `
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the exam statistics from the following images of the document."
          },
          ...images.reduce<{ type: "image"; image: Buffer }[]>((acc, image) => {
            if (image.buffer) {
              acc.push({
                type: "image",
                image: image.buffer
              });
            }
            return acc;
          }, [])
        ]
      }
    ]
  });

  return result.object.results;
};

export const uploadSummary = async (
  year: string,
  summaryOutput: z.infer<typeof outputSchema>["results"]
) => {
  console.log("Uploading summary...");
  for (const [paperNumber, questions] of Object.entries(summaryOutput)) {
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

    for (const [questionNumber, stats] of Object.entries(questions)) {
      await db
        .update(questionTable)
        .set({
          attempts:
            typeof stats.attempts === "string"
              ? Number.parseInt(stats.attempts)
              : null,
          minimumMark:
            typeof stats.min === "string" ? Number.parseInt(stats.min) : null,
          maximumMark:
            typeof stats.max === "string" ? Number.parseInt(stats.max) : null,
          medianMark:
            typeof stats.median === "string"
              ? Number.parseInt(stats.median)
              : null
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
