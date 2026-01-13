import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { eq, isNull } from "drizzle-orm";
import { fromBuffer } from "pdf2pic";
import { z } from "zod";
import { db } from "@/db";
import { paperYearTable } from "@/db/schema/paper";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";
import { env } from "@/env";

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY
});

const model = openai("gpt-4o");

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
    const paperPdfBlob = await paperPdf.blob();
    const paperPdfBuffer = await paperPdfBlob.arrayBuffer();

    const convert = fromBuffer(Buffer.from(paperPdfBuffer), {
      format: "png",
      width: undefined,
      height: undefined,
      density: 150,
      quality: 100
    });

    const image = await convert(1, {
      responseType: "buffer"
    });

    if (!image.buffer) {
      console.error(`Failed to convert paper ${paperYear.id} to image`);
      continue;
    }

    const result = await generateObject({
      model,
      schema: outputSchema,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts the Tripos Part that a given exam paper belongs to,
          out of part1a, part1b, and part2.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the Tripos Part from the following image of the document."
            },
            {
              type: "image",
              image: image.buffer
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
