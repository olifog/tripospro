import { db } from "@/db";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { fetchWithAuth, model } from "./index";

import { z } from "zod";

const triposPartOutputSchema = z.object({
  candidates: z.number(),
  starredFirsts: z.number(),
  firsts: z.number(),
  twoOnes: z.number(),
  twoTwos: z.number(),
  thirds: z.number(),
  unclassed: z.number(),
  withdrawn: z.number()
});

const outputSchema = z.object({
  part1a: triposPartOutputSchema.optional(),
  part1b: triposPartOutputSchema.optional(),
  part2: triposPartOutputSchema.optional()
});

export const digestReport = async (reportUrl: string) => {
  const reportPdf = await fetchWithAuth(reportUrl);
  const pdfBuffer = Buffer.from(await reportPdf.arrayBuffer());
  console.log("Report loaded");

  const result = await generateObject({
    model,
    schema: outputSchema,
    system: `You are a helpful assistant that extracts exam statistics from a Report PDF for Cambridge Computer Science.
        You will be given a PDF file, and will need to extract for each Tripos Part (Part 1a, Part 1b, Part 2) the following statistics:
        - Number of candidates
        - Number of starred firsts
        - Number of firsts
        - Number of 2:1s
        - Number of 2:2s
        - Number of thirds
        - Number of unclassed
        - Number of withdrawn

        If the statistics are not present for a part in the document, don't include the entry
        for that part in the output.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the exam statistics from the following PDF document."
          },
          {
            type: "file",
            data: pdfBuffer.toString("base64"),
            mediaType: "application/pdf"
          }
        ]
      }
    ]
  });
  console.log("Result generated");

  return result.object;
};

export const uploadReport = async (
  year: string,
  reportOutput: z.infer<typeof outputSchema>
) => {
  const triposParts = Object.fromEntries(
    await Promise.all(
      Object.keys(reportOutput).map(async (part) => [
        part,
        await db.query.triposPartTable.findFirst({
          where: eq(triposPartTable.code, part)
        })
      ])
    )
  ) as Record<string, typeof triposPartTable.$inferSelect>;

  for (const [part, data] of Object.entries(reportOutput)) {
    const triposPart = triposParts[part];
    if (!triposPart) throw new Error(`Tripos part ${part} not found`);
    const triposPartYear = await db.query.triposPartYearTable.findFirst({
      where: and(
        eq(triposPartYearTable.year, Number.parseInt(year, 10)),
        eq(triposPartYearTable.triposPartId, triposPart.id)
      )
    });
    if (!triposPartYear) {
      console.error(`Tripos part year ${year} ${part} not found`);
      continue;
    }

    await db
      .update(triposPartYearTable)
      .set({
        candidates: data.candidates,
        starredFirsts: data.starredFirsts,
        firsts: data.firsts,
        twoOnes: data.twoOnes,
        twoTwos: data.twoTwos,
        thirds: data.thirds,
        unclassed: data.unclassed,
        withdrawn: data.withdrawn
      })
      .where(eq(triposPartYearTable.id, triposPartYear.id));

    console.log(`Uploaded ${part} for year ${year}`);
  }
};
