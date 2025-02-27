import * as fs from "node:fs";
import * as path from "node:path";
import { cwd } from "node:process";
import { seed } from "@/db/seed";
import { calendarYearToAcademicYear } from "@/lib/utils";
import { Command } from "commander";
import { parseCourseDB, type CourseDBSchema } from "./coursedb-parser/parse";
import { parseQuestions, type QuestionSchema, QuestionsSchema } from "./questions-parser";
import type { z } from "zod";
import { getOrPatchQuestion, resetDatabase } from "./upload";

const dbCommand = new Command("db").description("Database operations");

const skip_years = [2024, 2023, 2022, 2021, 2020]

const applyRemaps = (question: z.infer<typeof QuestionSchema>) => {
  const newQuestion = { ...question };

  if (newQuestion.topic === "Programming in C") {
    newQuestion.topic = "Programming in C and C++";
  }

  return newQuestion;
};

const ingestCommand = new Command("ingest")
  .description("Ingest public CST files into the database")
  .option("-r, --reset", "Reset the database")
  .action(async (options) => {
    console.log("Ingesting public CST files into the database...");

    if (options.reset) {
      await resetDatabase();
    }

    const coursedbMap = new Map<string, z.infer<typeof CourseDBSchema>>();

    // call the coursedb command
    let year = 2006;
    while (true) {
      try {
        await ingestCoursedb(
          calendarYearToAcademicYear(year),
          `./scripts/coursedb-parser/out/${year + 1}.json`
        );
        const coursedb = JSON.parse(
          fs.readFileSync(
            `./scripts/coursedb-parser/out/${year + 1}.json`,
            "utf8"
          )
        );
        coursedbMap.set((year + 1).toString(), coursedb);
        year++;
      } catch (error) {
        break;
      }
    }

    console.log(`Parsed coursedb files for years 2006 - ${year - 1}`);

    await questionsCommand.parseAsync([]);

    console.log("\n\n\nStarting uploading to db...");

    const questions = QuestionsSchema.parse(
      JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "./questions-parser/questions.json"),
          "utf8"
        )
      )
    );

    for (const rawQuestion of questions) {
      if (skip_years.includes(Number(rawQuestion.year))) {
        continue;
      }

      const question = applyRemaps(rawQuestion);

      const coursedb = coursedbMap.get(question.year);
      if (!coursedb) {
        throw new Error(`Coursedb not found for year ${question.year}`);
      }

      const triposParts = coursedb.groups
        ? Object.fromEntries(
            Object.values(coursedb.groups).map((group) => {
              const key = Object.entries(group).reduce((acc, field) => {
                if (!["_label", "title", "teaching-admin"].includes(field[0])) {
                  return typeof field[1] === "string" ? field[1] : field[1]._label;
                }
                return acc;
              }, "");
              return [key.split("-")[0], group.title];
            })
          )
        : Object.fromEntries(
            Object.entries(coursedb.classes ?? {}).map(([key, value]) => {
              if (typeof value === "string") {
                return [key, value];
              }
              return [key.split("-")[0], value.title];
            })
          );

      const course = Object.entries(coursedb.courses).find(([key, value]) => {
        return value._label === question.topic;
      })?.[0];

      if (!course) {
        throw new Error(`Course not found for question ${question.topic}`);
      }

      const questionInput = {
        paper: question.paper,
        questionNumber: question.question,
        year: question.year,
        solutionUrl: question.solutions,
        url: `https://www.cl.cam.ac.uk/teaching/exams/pastpapers/${question.pdf}`,
        authors: question.author
          ? question.author.split("+").reduce((acc: { crsid: string; name: string }[], crsid) => {
              if (!coursedb.lecturers[crsid]) {
                return acc;
              }
              const name =
                typeof coursedb.lecturers[crsid] === "string"
                  ? coursedb.lecturers[crsid]
                  : coursedb.lecturers[crsid]._label;
              acc.push({ crsid, name });
              return acc;
            }, [])
          : [],
        paperYear: {
          triposPart: {
            name: triposParts[
              (Object.values(coursedb.courses[course].classes ?? {})[0] as string).split("-")[0]
            ],
            code: (Object.values(
              coursedb.courses[course].classes ?? {}
            )[0] as string).split("-")[0],
          },
        },
        course: {
          url: `https://www.cl.cam.ac.uk/teaching/${question.year}/${course}`,
          michaelmas:
            (typeof coursedb.courses[course].term === "string" &&
              coursedb.courses[course].term === "M") ||
            (typeof coursedb.courses[course].term === "object" &&
              Object.values(coursedb.courses[course].term).includes("M")),
          lent:
            (typeof coursedb.courses[course].term === "string" &&
              coursedb.courses[course].term === "L") ||
            (typeof coursedb.courses[course].term === "object" &&
              Object.values(coursedb.courses[course].term).includes("L")),
          easter:
            (typeof coursedb.courses[course].term === "string" &&
              coursedb.courses[course].term === "E") ||
            (typeof coursedb.courses[course].term === "object" &&
              Object.values(coursedb.courses[course].term).includes("E")),
          lectures:
            typeof coursedb.courses[course].hours === "number"
              ? coursedb.courses[course].hours
              : coursedb.courses[course].hours?._label
              ? Number.parseInt(coursedb.courses[course].hours._label)
              : undefined,
          moodleId: coursedb.courses[course].moodle
            ? coursedb.courses[course].moodle.toString()
            : undefined,
          suggestedSupervisions: coursedb.courses[course].supervision_hours,
          format: coursedb.courses[course].format,
          lecturers: coursedb.courses[course].lecturer
            ? (typeof coursedb.courses[course].lecturer === "string"
                ? [coursedb.courses[course].lecturer]
                : Object.values(coursedb.courses[course].lecturer)
              ).reduce((acc: { crsid: string; name: string }[], crsid) => {
                if (!coursedb.lecturers[crsid]) {
                  return acc;
                }
                const name =
                  typeof coursedb.lecturers[crsid] === "string"
                    ? coursedb.lecturers[crsid]
                    : coursedb.lecturers[crsid]._label;
                acc.push({ crsid, name });
                return acc;
              }, [])
            : undefined,
          course: {
            code: course,
            name: coursedb.courses[course]._label,
          },
        },
      };

      console.log(JSON.stringify(questionInput, null, 2));

      await getOrPatchQuestion(questionInput);
    }
  });

const ingestCoursedb = async (year: string, outputPath: string) => {
  const response = await fetch(
    `https://www.cl.cam.ac.uk/teaching/${year}/coursedb.txt`
  );
  const content = await response.text();

  if (response.status !== 200) {
    throw new Error(`Failed to fetch coursedb.txt for year ${year}`);
  }

  console.log(`Parsing coursedb.txt for year ${year}...`);
  const coursedb = parseCourseDB({ content });

  fs.writeFileSync(outputPath, JSON.stringify(coursedb, null, 2));
  console.log(`Saved coursedb.txt for year ${year} to ${outputPath}`);
};

const coursedbCommand = new Command("coursedb")
  .description("Ingest the coursedb.txt file into the database")
  .option("-y, --year <year>", "The year to ingest the coursedb.txt file for")
  .option(
    "-o, --output <output>",
    "The output file to save the coursedb.txt file to"
  )
  .action(async (options) => {
    const year = options.year
      ? calendarYearToAcademicYear(Number.parseInt(options.year))
      : "current";

    const outputPath = options.output
      ? path.join(cwd(), options.output)
      : path.join(__dirname, "./coursedb-parser/out/coursedb.json");

    await ingestCoursedb(year, outputPath);
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
      throw new Error("Failed to fetch index.csv");
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
