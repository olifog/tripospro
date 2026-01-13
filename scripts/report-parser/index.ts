import fs from "node:fs";
import path from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "../../src/env";
import { digestComments, uploadComments } from "./comment";
import { digestReport, uploadReport } from "./report";
import { digestSummary, uploadSummary } from "./summary";

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY
});

export const model = openai("gpt-4o");

const BASE_URL = "https://www.cl.cam.ac.uk/teaching/exams/reports/";

const triposPartYearSchema = z.object({
  reportUrl: z
    .string()
    .transform((url) => `${BASE_URL}${url}`)
    .optional(),
  commentsUrl: z
    .string()
    .transform((url) => `${BASE_URL}${url}`)
    .optional(),
  summaryUrl: z
    .string()
    .transform((url) => `${BASE_URL}${url}`)
    .optional()
});

const yearSchema = z.object({
  part1a: triposPartYearSchema,
  part1b: triposPartYearSchema,
  part2: triposPartYearSchema
});

const schema = z.record(z.string(), yearSchema);

let _years: z.infer<typeof schema> | null = null;

const years = () => {
  if (_years === null) {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./parsed.json"), "utf8")
    );
    _years = schema.parse(parsed);
  }
  return _years;
};

export const ingestYear = async (year: string) => {
  const yearData = years()[year];
  if (!yearData) throw new Error(`Year ${year} not found`);

  const seenUrls = new Set<string>();

  for (const [part, data] of Object.entries(yearData)) {
    const reportUrl = data.reportUrl;
    if (!reportUrl) {
      console.error(`Report URL for year ${year} ${part} not found`);
    } else if (!seenUrls.has(reportUrl)) {
      seenUrls.add(reportUrl);
      const reportOutput = await digestReport(reportUrl);
      await uploadReport(year, reportOutput);
    }

    const commentsUrl = data.commentsUrl;
    if (!commentsUrl) {
      console.error(`Comments URL for year ${year} ${part} not found`);
    } else if (!seenUrls.has(commentsUrl)) {
      seenUrls.add(commentsUrl);
      const commentsOutput = await digestComments(commentsUrl);
      await uploadComments(year, commentsOutput);
    }

    const summaryUrl = data.summaryUrl;
    if (!summaryUrl) {
      console.error(`Summary URL for year ${year} ${part} not found`);
    } else if (!seenUrls.has(summaryUrl)) {
      seenUrls.add(summaryUrl);
      const summaryOutput = await digestSummary(summaryUrl);
      await uploadSummary(year, summaryOutput);
    }
  }
};
