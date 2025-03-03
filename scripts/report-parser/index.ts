import fs from "node:fs";
import { z } from "zod";

import path from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "../../src/env";

import { LlamaParseReader } from "@llamaindex/cloud";
import { digestComments } from "./comment";
import { uploadComments } from "./comment";
import { digestReport } from "./report";
import { uploadReport } from "./report";
import { digestSummary } from "./summary";
import { uploadSummary } from "./summary";

export const reader = new LlamaParseReader({
  apiKey: env.LLAMA_CLOUD_API_KEY,
  resultType: "markdown",
  maxTimeout: 10000
});

const openai = createOpenAI({
  compatibility: "strict",
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
  if (!["2022", "2021"].includes(year)) {
    return;
  }

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
      console.log(summaryOutput);
      await uploadSummary(year, summaryOutput);
    }
    throw new Error("Not implemented");
  }
};
