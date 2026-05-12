import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";

const bedrock = createAmazonBedrock({ region: "eu-west-2" });
const model = bedrock("global.anthropic.claude-opus-4-6-v1");

const PDF_DIR = "/tmp/tripospro-pdfs";

const parsedJson: Record<
  string,
  {
    part1a: { reportUrl?: string; commentsUrl?: string; summaryUrl?: string };
    part1b: { reportUrl?: string; commentsUrl?: string; summaryUrl?: string };
    part2: { reportUrl?: string; commentsUrl?: string; summaryUrl?: string };
  }
> = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "./report-parser/parsed.json"),
    "utf8"
  )
);

const commentSchema = z.object({
  comments: z.record(z.string(), z.record(z.string(), z.string()))
});

const summarySchema = z.object({
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

const reportPartSchema = z.object({
  candidates: z.number(),
  starredFirsts: z.number(),
  firsts: z.number(),
  twoOnes: z.number(),
  twoTwos: z.number(),
  thirds: z.number(),
  unclassed: z.number(),
  withdrawn: z.number()
});

const reportSchema = z.object({
  part1a: reportPartSchema.optional(),
  part1b: reportPartSchema.optional(),
  part2: reportPartSchema.optional()
});

function localPdfPath(url: string): string | null {
  const filename = url.split("/").pop()!;
  const p = path.join(PDF_DIR, filename);
  return fs.existsSync(p) ? p : null;
}

async function digestComments(pdfPath: string) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`  Digesting comments from ${path.basename(pdfPath)} (${pdfBuffer.length} bytes)...`);
  const result = await generateObject({
    model,
    schema: commentSchema,
    system: `You are a helpful assistant that extracts examiner feedback comments from a pdf.

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
        and all the papers will be ordered sequentially in order (with questions ordered within each paper).`,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the examiner feedback comments from the following PDF document." },
          { type: "file", data: pdfBuffer.toString("base64"), mediaType: "application/pdf" }
        ]
      }
    ]
  });
  return result.object.comments;
}

async function digestSummary(pdfPath: string) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`  Digesting summary from ${path.basename(pdfPath)} (${pdfBuffer.length} bytes)...`);
  const result = await generateObject({
    model,
    schema: summarySchema,
    system: `You are a helpful assistant that extracts exam statistics from a Summary PDF for Cambridge Computer Science.

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
        Paper 7 table, you should aggregate the results into a single "7" table.`,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the exam statistics from the following PDF document." },
          { type: "file", data: pdfBuffer.toString("base64"), mediaType: "application/pdf" }
        ]
      }
    ]
  });
  return result.object.results;
}

async function digestReport(pdfPath: string) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`  Digesting report from ${path.basename(pdfPath)} (${pdfBuffer.length} bytes)...`);
  const result = await generateObject({
    model,
    schema: reportSchema,
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
          { type: "text", text: "Extract the exam statistics from the following PDF document." },
          { type: "file", data: pdfBuffer.toString("base64"), mediaType: "application/pdf" }
        ]
      }
    ]
  });
  return result.object;
}

async function uploadComments(year: string, comments: Record<string, Record<string, string>>) {
  for (const [paperNumber, questions] of Object.entries(comments)) {
    const paper = await db.query.paperTable.findFirst({ where: eq(paperTable.name, paperNumber) });
    if (!paper) { console.error(`    Paper ${paperNumber} not found`); continue; }
    const paperYear = await db.query.paperYearTable.findFirst({
      where: and(eq(paperYearTable.paperId, paper.id), eq(paperYearTable.year, parseInt(year)))
    });
    if (!paperYear) { console.error(`    Paper year ${paperNumber} ${year} not found`); continue; }
    for (const [qNum, comment] of Object.entries(questions)) {
      await db.update(questionTable).set({ examinerComment: comment })
        .where(and(eq(questionTable.paperYearId, paperYear.id), eq(questionTable.questionNumber, parseInt(qNum))));
    }
  }
  console.log(`  Uploaded comments for ${year}`);
}

async function uploadSummary(year: string, results: Record<string, Record<string, { attempts?: string; min?: string; max?: string; median?: string }>>) {
  for (const [paperNumber, questions] of Object.entries(results)) {
    const paper = await db.query.paperTable.findFirst({ where: eq(paperTable.name, paperNumber) });
    if (!paper) { console.error(`    Paper ${paperNumber} not found`); continue; }
    const paperYear = await db.query.paperYearTable.findFirst({
      where: and(eq(paperYearTable.paperId, paper.id), eq(paperYearTable.year, parseInt(year)))
    });
    if (!paperYear) { console.error(`    Paper year ${paperNumber} ${year} not found`); continue; }
    for (const [qNum, stats] of Object.entries(questions)) {
      await db.update(questionTable).set({
        attempts: typeof stats.attempts === "string" ? parseInt(stats.attempts) : null,
        minimumMark: typeof stats.min === "string" ? parseInt(stats.min) : null,
        maximumMark: typeof stats.max === "string" ? parseInt(stats.max) : null,
        medianMark: typeof stats.median === "string" ? parseInt(stats.median) : null,
      }).where(and(eq(questionTable.paperYearId, paperYear.id), eq(questionTable.questionNumber, parseInt(qNum))));
    }
  }
  console.log(`  Uploaded summary for ${year}`);
}

async function uploadReport(year: string, report: z.infer<typeof reportSchema>) {
  const triposParts = Object.fromEntries(
    await Promise.all(Object.keys(report).map(async (part) => [
      part, await db.query.triposPartTable.findFirst({ where: eq(triposPartTable.code, part) })
    ]))
  ) as Record<string, typeof triposPartTable.$inferSelect>;

  for (const [part, data] of Object.entries(report)) {
    const triposPart = triposParts[part];
    if (!triposPart) continue;
    const tpy = await db.query.triposPartYearTable.findFirst({
      where: and(eq(triposPartYearTable.year, parseInt(year)), eq(triposPartYearTable.triposPartId, triposPart.id))
    });
    if (!tpy) { console.error(`    TPY ${year} ${part} not found`); continue; }
    await db.update(triposPartYearTable).set({
      candidates: data.candidates, starredFirsts: data.starredFirsts, firsts: data.firsts,
      twoOnes: data.twoOnes, twoTwos: data.twoTwos, thirds: data.thirds,
      unclassed: data.unclassed, withdrawn: data.withdrawn,
    }).where(eq(triposPartYearTable.id, tpy.id));
    console.log(`  Uploaded report ${part} for ${year}`);
  }
}

const BASE_URL = "https://www.cl.cam.ac.uk/teaching/exams/reports/";

async function processYear(year: string) {
  console.log(`\n=== Processing year ${year} ===`);
  const yearData = parsedJson[year];
  if (!yearData) { console.error(`Year ${year} not in parsed.json`); return; }

  const seenUrls = new Set<string>();

  for (const [part, data] of Object.entries(yearData)) {
    const reportFilename = data.reportUrl;
    if (reportFilename) {
      const fullUrl = `${BASE_URL}${reportFilename}`;
      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        const localPath = localPdfPath(fullUrl);
        if (localPath) {
          try {
            const report = await digestReport(localPath);
            await uploadReport(year, report);
          } catch (e: any) { console.error(`  Report error: ${e.message?.slice(0, 200)}`); }
        } else { console.log(`  No local PDF for ${reportFilename}`); }
      }
    }

    const commentsFilename = data.commentsUrl;
    if (commentsFilename) {
      const fullUrl = `${BASE_URL}${commentsFilename}`;
      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        const localPath = localPdfPath(fullUrl);
        if (localPath) {
          try {
            const comments = await digestComments(localPath);
            await uploadComments(year, comments);
          } catch (e: any) { console.error(`  Comments error: ${e.message?.slice(0, 200)}`); }
        } else { console.log(`  No local PDF for ${commentsFilename}`); }
      }
    }

    const summaryFilename = data.summaryUrl;
    if (summaryFilename) {
      const fullUrl = `${BASE_URL}${summaryFilename}`;
      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        const localPath = localPdfPath(fullUrl);
        if (localPath) {
          try {
            const summary = await digestSummary(localPath);
            await uploadSummary(year, summary);
          } catch (e: any) { console.error(`  Summary error: ${e.message?.slice(0, 200)}`); }
        } else { console.log(`  No local PDF for ${summaryFilename}`); }
      }
    }
  }

  console.log(`=== Finished year ${year} ===`);
}

async function main() {
  const years = ["2021", "2022", "2023", "2024", "2025"];
  for (const year of years) {
    await processYear(year);
  }
  console.log("\nDone!");
  process.exit(0);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
