import "dotenv/config";
import fs from "node:fs";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";

const bedrock = createAmazonBedrock({ region: "eu-west-2" });
const model = bedrock("anthropic.claude-sonnet-4-6");

const commentSchema = z.object({
  comments: z.record(z.string(), z.record(z.string(), z.string()))
});

const systemPrompt = `You are a helpful assistant that extracts examiner feedback comments from a pdf.

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
and all the papers will be ordered sequentially in order (with questions ordered within each paper).`;

async function digestAndUpload(pdfPath: string, year: string) {
  const pdf = fs.readFileSync(pdfPath);
  console.log(`Digesting ${pdfPath} (${pdf.length} bytes) for year ${year}...`);
  const start = Date.now();

  const result = await generateObject({
    model,
    schema: commentSchema,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Extract the examiner feedback comments from the following PDF document." },
        { type: "file", data: pdf.toString("base64"), mediaType: "application/pdf" }
      ]
    }]
  });

  const comments = result.object.comments;
  const papers = Object.keys(comments);
  const totalQ = Object.values(comments).reduce((s, qs) => s + Object.keys(qs).length, 0);
  console.log(`Extracted in ${((Date.now() - start) / 1000).toFixed(0)}s: ${papers.length} papers, ${totalQ} questions`);

  for (const [paperNumber, questions] of Object.entries(comments)) {
    const paper = await db.query.paperTable.findFirst({ where: eq(paperTable.name, paperNumber) });
    if (!paper) { console.error(`  Paper ${paperNumber} not found`); continue; }
    const paperYear = await db.query.paperYearTable.findFirst({
      where: and(eq(paperYearTable.paperId, paper.id), eq(paperYearTable.year, parseInt(year)))
    });
    if (!paperYear) { console.error(`  Paper year ${paperNumber} ${year} not found`); continue; }
    let updated = 0;
    for (const [qNum, comment] of Object.entries(questions)) {
      const res = await db.update(questionTable).set({ examinerComment: comment })
        .where(and(eq(questionTable.paperYearId, paperYear.id), eq(questionTable.questionNumber, parseInt(qNum))));
      updated++;
    }
    console.log(`  Paper ${paperNumber}: ${updated} questions updated`);
  }
  console.log(`Done uploading ${year}`);
}

async function main() {
  await digestAndUpload("/tmp/tripospro-pdfs/comments2021ab.pdf", "2021");
  await digestAndUpload("/tmp/tripospro-pdfs/comments2022.pdf", "2022");
  console.log("\nAll done!");
  process.exit(0);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
