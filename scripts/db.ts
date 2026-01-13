import * as fs from "node:fs";
import * as path from "node:path";
import { cwd } from "node:process";
import { Command } from "commander";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { courseTable } from "@/db/schema/course";
import { seed } from "@/db/seed";
import { calendarYearToAcademicYear } from "@/lib/utils";
import { type CourseDBSchema, parseCourseDB } from "./coursedb-parser/parse";
import { linkOldPapers } from "./link-old";
import {
  parseQuestions,
  type QuestionSchema,
  QuestionsSchema
} from "./questions-parser";
import { ingestYear } from "./report-parser";
import { getOrPatchQuestion, resetDatabase } from "./upload";

const dbCommand = new Command("db").description("Database operations");

const applyQuestionRemaps = (question: z.infer<typeof QuestionSchema>) => {
  const newQuestion = { ...question };

  if (newQuestion.topic === "Programming in C") {
    newQuestion.topic = "Programming in C and C++";
  }

  if (
    newQuestion.topic === "Artificial Intelligence" &&
    newQuestion.year === "2017"
  ) {
    newQuestion.topic = "Artificial Intelligence I";
  }

  if (newQuestion.topic === "Object-Oriented Programming with Java") {
    newQuestion.topic = "Object-Oriented Programming";
  }

  if (
    newQuestion.topic === "Algorithms" &&
    ["2007", "2008"].includes(newQuestion.year)
  ) {
    newQuestion.topic = "Algorithms I";
  }

  return newQuestion;
};

const applyCourseDbRemaps = (courseDb: z.infer<typeof CourseDBSchema>) => {
  const newCourseDb = { ...courseDb };

  newCourseDb.courses = Object.fromEntries(
    Object.entries(newCourseDb.courses).reduce<
      [string, z.infer<typeof CourseDBSchema>["courses"][number]][]
    >((acc, [key, value]) => {
      value._label = value._label.replace(/\u00A0/g, " ");
      if (["Programming in C", "C and C++"].includes(value._label)) {
        value._label = "Programming in C and C++";
      }
      if (value._label === "Human-Computer Interaction") {
        value._label = "Human–Computer Interaction";
      }
      if (value._label === "Principles of Communication") {
        value._label = "Principles of Communications";
      }
      if (value._label === "Programming Methods") {
        value._label = "Programming Methods and Java";
      }
      if (value._label === "Operating Systems I") {
        value._label = "Operating Systems";
      }
      if (
        courseDb.myear === 2010 &&
        value._label === "Concurrent and Distributed Systems II"
      ) {
        return acc;
      }
      if (
        courseDb.myear === 2010 &&
        value._label === "Concurrent and Distributed Systems I"
      ) {
        value._label = "Concurrent and Distributed Systems";
        value.term = {
          "1": "M",
          "2": "L"
        };
      }
      // replace nbsp with space
      acc.push([key, value]);
      return acc;
    }, [])
  );

  return newCourseDb;
};

const applyTriposPartRemaps = (triposPart: string) => {
  if (triposPart === "diploma") {
    return "part2";
  }
  return triposPart.split("-")[0].slice(0, 6);
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
        coursedbMap.set((year + 1).toString(), applyCourseDbRemaps(coursedb));
        year++;
      } catch (_error) {
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
      const question = applyQuestionRemaps(rawQuestion);

      const coursedb = coursedbMap.get(question.year);
      // if (!coursedb) {
      //   throw new Error(`Coursedb not found for year ${question.year}`);
      // }

      const triposParts = !coursedb
        ? {}
        : coursedb.groups
          ? Object.fromEntries(
              Object.values(coursedb.groups).map((group) => {
                const key = Object.entries(group).reduce((acc, field) => {
                  if (
                    !["_label", "title", "teaching-admin"].includes(field[0])
                  ) {
                    return typeof field[1] === "string"
                      ? field[1]
                      : field[1]._label;
                  }
                  return acc;
                }, "");
                return [applyTriposPartRemaps(key), group.title];
              })
            )
          : Object.fromEntries(
              Object.entries(coursedb.classes ?? {}).map(([key, value]) => {
                if (typeof value === "string") {
                  return [key, value];
                }
                return [applyTriposPartRemaps(key), value.title];
              })
            );

      const course = Object.entries(coursedb?.courses ?? {}).find(
        ([_key, value]) => {
          return value._label === question.topic;
        }
      )?.[0];

      if (course && coursedb) {
        const questionInput = {
          paper: question.paper,
          questionNumber: question.question,
          year: question.year,
          solutionUrl: question.solutions,
          url: `https://www.cl.cam.ac.uk/teaching/exams/pastpapers/${question.pdf}`,
          authors: question.author
            ? question.author
                .split("+")
                .reduce((acc: { crsid: string; name: string }[], crsid) => {
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
                applyTriposPartRemaps(
                  Object.values(
                    coursedb.courses[course].classes ?? {}
                  )[0] as string
                )
              ],
              code: applyTriposPartRemaps(
                Object.values(
                  coursedb.courses[course].classes ?? {}
                )[0] as string
              )
            }
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
                  ? Number.parseInt(coursedb.courses[course].hours._label, 10)
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
              name: coursedb.courses[course]._label
            }
          }
        };

        console.log(JSON.stringify(questionInput, null, 2));

        await getOrPatchQuestion(questionInput);
      } else {
        const questionInput = {
          paper: question.paper,
          questionNumber: question.question,
          year: question.year,
          solutionUrl: question.solutions,
          url: `https://www.cl.cam.ac.uk/teaching/exams/pastpapers/${question.pdf}`,
          authors: [],
          paperYear: {},
          course: {
            url: `https://www.cl.cam.ac.uk/teaching/${question.year}`,
            michaelmas: false,
            lent: false,
            easter: false,
            course: {
              name: question.topic,
              code:
                (
                  await db.query.courseTable.findFirst({
                    where: eq(courseTable.name, question.topic)
                  })
                )?.code ?? question.topic
            }
          }
        };

        console.log(JSON.stringify(questionInput, null, 2));

        await getOrPatchQuestion(questionInput);
      }
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
      ? calendarYearToAcademicYear(Number.parseInt(options.year, 10))
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

const reportsCommand = new Command("reports")
  .description("Ingest exam statistics")
  .option("-y, --year <year>", "The year to ingest the exam statistics of")
  .option("-a, --all", "Ingest all years")
  .action(async (options) => {
    let startYear: number | undefined;
    let endYear: number | undefined;

    if (options.year) {
      startYear = Number.parseInt(options.year, 10);
      endYear = startYear;
    }
    if (options.all) {
      startYear = 2000;
      endYear = new Date().getFullYear();
    }

    if (startYear && endYear) {
      for (let year = startYear; year <= endYear; year++) {
        console.log(`\nIngesting exam statistics for year ${year}...`);
        try {
          await ingestYear(year.toString());
        } catch (error) {
          console.error(
            `Error ingesting exam statistics for year ${year}: ${error}`
          );
        }
      }
    } else {
      throw new Error("No year or all flag provided");
    }
  });

const linkOldPapersCommand = new Command("link-old-papers")
  .description("Create TriposPartYears for old papers")
  .action(async () => {
    console.log("Linking old papers to the new papers...");

    await linkOldPapers();

    console.log("Done!");
  });

dbCommand.addCommand(ingestCommand);
ingestCommand.addCommand(coursedbCommand);
ingestCommand.addCommand(questionsCommand);
ingestCommand.addCommand(reportsCommand);
ingestCommand.addCommand(linkOldPapersCommand);

const seedCommand = new Command("seed")
  .description("Seed the database with sample data")
  .action(() => {
    console.log("Seeding database...");
    seed();
  });

dbCommand.addCommand(seedCommand);

export { dbCommand };
