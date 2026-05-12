import { db } from "@/db";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateObject } from "ai";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { paperYearTable } from "@/db/schema/paper";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";

const bedrock = createAmazonBedrock({
  region: "eu-west-2"
});

const model = bedrock("anthropic.claude-opus-4-6-v1");

const outputSchema = z.object({
  part: z.enum(["part1a", "part1b", "part2"])
});

const getOrCreateTriposPartYear = async (part: string, year: number) => {
  const triposPart = await db.query.triposPartTable.findFirst({
    where: eq(triposPartTable.code, part),
    with: {
      triposPartYears: {
        where: eq(triposPartYearTable.year, year)
      }
    }
  });

  if (!triposPart) {
    throw new Error(`Tripos part ${part} not found`);
  }

  if (triposPart.triposPartYears.length >= 1) {
    return triposPart.triposPartYears[0];
  }

  const newTriposPartYear = await db
    .insert(triposPartYearTable)
    .values({
      year,
      triposPartId: triposPart.id
    })
    .returning();

  if (newTriposPartYear.length !== 1) {
    throw new Error("Failed to create tripos part year");
  }

  return newTriposPartYear[0];
};

export const linkOldPapers = async () => {
  const paperYearsToLink = await db.query.paperYearTable.findMany({
    where: isNull(paperYearTable.triposPartYearId)
  });

  for (const paperYear of paperYearsToLink) {
    console.log(`Linking paper ${paperYear.paperId} year ${paperYear.year}...`);
    const paperPdf = await fetch(paperYear.url);
    const pdfBuffer = Buffer.from(await paperPdf.arrayBuffer());

    const result = await generateObject({
      model,
      schema: outputSchema,
      system: `You are a helpful assistant that extracts the Tripos Part that a given exam paper belongs to,
          out of part1a, part1b, and part2.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the Tripos Part from the following PDF document."
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

    const part = result.object.part;

    const triposPartYear = await getOrCreateTriposPartYear(
      part,
      paperYear.year
    );

    await db
      .update(paperYearTable)
      .set({
        triposPartYearId: triposPartYear.id
      })
      .where(eq(paperYearTable.id, paperYear.id));

    console.log(
      `Linked paper ${paperYear.paperId} year ${paperYear.year} to ${part}`
    );
  }
};
