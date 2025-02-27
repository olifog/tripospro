import * as fs from "node:fs";
import * as path from "node:path";
import { cwd } from "node:process";
import { seed } from "@/db/seed";
import { calendarYearToAcademicYear } from "@/lib/utils";
import { Command } from "commander";
import { parseCourseDB } from "./coursedb-parser/parse";
import { parseQuestions } from "./questions-parser";

const dbCommand = new Command("db").description("Database operations");

const ingestCommand = new Command("ingest").description(
  "Ingest public CST files into the database"
);

const coursedbCommand = new Command("coursedb")
  .description("Ingest the coursedb.txt file into the database")
  .option(
    "-y, --year <year>",
    "The year to ingest the coursedb.txt file for",
    "current"
  )
  .option(
    "-o, --output <output>",
    "The output file to save the coursedb.txt file to"
  )
  .action(async (options) => {
    console.log(`Fetching coursedb.txt for year ${options.year}...`);
    const year =
      options.year !== "current"
        ? calendarYearToAcademicYear(Number.parseInt(options.year))
        : options.year;

    // fetch from https://www.cl.cam.ac.uk/teaching/{year}/coursedb.txt
    const response = await fetch(
      `https://www.cl.cam.ac.uk/teaching/${year}/coursedb.txt`
    );
    const content = await response.text();

    if (response.status !== 200) {
      console.error(`Failed to fetch coursedb.txt for year ${year}`);
      return;
    }

    console.log(`Parsing coursedb.txt for year ${year}...`);
    const coursedb = parseCourseDB({ content });
    // save to file
    const outputPath = options.output
      ? path.join(cwd(), options.output)
      : path.join(__dirname, "./coursedb-parser/out/coursedb.json");

    fs.writeFileSync(outputPath, JSON.stringify(coursedb, null, 2));
    console.log(`Saved coursedb.txt for year ${year} to ${outputPath}`);
  });

const questionsCommand = new Command("questions")
  .description("Ingest the index.csv file into the database")
  .option(
    "-o, --output <output>",
    "The output file to save the index.csv file to"
  )
  .action(async (options) => {
    console.log("Fetching index.csv...");

    // fetch from https://www.cl.cam.ac.uk/teaching/exams/pastpapers/index.csv
    const response = await fetch(
      "https://www.cl.cam.ac.uk/teaching/exams/pastpapers/index.csv"
    );
    const content = await response.text();

    if (response.status !== 200) {
      console.error("Failed to fetch index.csv");
      return;
    }

    const questions = parseQuestions({ content });

    const outputPath = options.output
      ? path.join(cwd(), options.output)
      : path.join(__dirname, "./questions-parser/questions.json");

    // save to file
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
    console.log(`Saved index.csv to ${outputPath}`);
  });

dbCommand.addCommand(ingestCommand);
ingestCommand.addCommand(coursedbCommand);
ingestCommand.addCommand(questionsCommand);

const seedCommand = new Command("seed")
  .description("Seed the database with sample data")
  .action(() => {
    console.log("Seeding database...");
    seed();
  });

dbCommand.addCommand(seedCommand);

export { dbCommand };
