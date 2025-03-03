import fs from "node:fs";
import { db } from "@/db";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { model, reader } from ".";

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
  const summaryPdf = await fetch(summaryUrl);
  const file = new File([await summaryPdf.blob()], "summary.pdf", {
    type: "application/pdf"
  });
  const fileBuffer = await file.arrayBuffer();
  fs.writeFileSync("/tmp/summary.pdf", Buffer.from(fileBuffer));

  const summary = await reader.loadData("/tmp/summary.pdf");
  const jsonOutput = summary.map((doc) => doc.toJSON());
  console.log(jsonOutput);

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
        `
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the exam statistics from the following document."
          },
          {
            type: "text",
            text: JSON.stringify(jsonOutput, null, 2)
          }
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
  console.log(summaryOutput);
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
