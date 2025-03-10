import { db } from "@/db";
import {
  courseTable,
  courseYearPaperYearTable,
  courseYearTable
} from "@/db/schema/course";
import { courseYearLecturerTable } from "@/db/schema/course";
import { paperTable } from "@/db/schema/paper";
import { paperYearTable } from "@/db/schema/paper";
import { questionAuthorTable, questionTable } from "@/db/schema/question";
import {
  triposPartTable,
  triposPartYearTable,
  triposTable
} from "@/db/schema/tripos";
import {
  userQuestionAnswerTable,
  userSettingsTable,
  usersTable
} from "@/db/schema/user";
import { and, eq } from "drizzle-orm";
import { uploadQuestionToVectorDb } from "./vectordb";

const cache = {
  papers: new Map<string, typeof paperTable.$inferSelect>(),
  paperYears: new Map<string, typeof paperYearTable.$inferSelect>(),
  triposPartYears: new Map<string, typeof triposPartYearTable.$inferSelect>(),
  triposParts: new Map<string, typeof triposPartTable.$inferSelect>(),
  tripos: new Map<string, typeof triposTable.$inferSelect>(),
  courses: new Map<string, typeof courseTable.$inferSelect>(),
  courseYears: new Map<string, typeof courseYearTable.$inferSelect>(),
  questions: new Map<string, typeof questionTable.$inferSelect>()
};

export type PatchUserData = {
  name?: string;
};

export const getOrPatchUser = async (crsid: string, data: PatchUserData) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.crsid, crsid)
  });

  if (user) {
    return user;
  }

  const newUser = await db
    .insert(usersTable)
    .values({
      crsid,
      name: data.name,
      email: `${crsid}@cam.ac.uk`
    })
    .returning();

  if (newUser.length !== 1) {
    throw new Error(`Failed to create user ${crsid}`);
  }

  return newUser[0];
};

export type PatchCourseData = {
  code: string;
  name: string;
};

export type PatchCourseYearData = {
  url: string;
  course: PatchCourseData;
  michaelmas: boolean;
  lent: boolean;
  easter: boolean;
  lectures?: number;
  moodleId?: string;
  suggestedSupervisions?: number;
  format?: string;
  lecturers?: {
    crsid: string;
    name: string;
  }[];
};

export type PatchQuestionData = {
  paper: string;
  questionNumber: string;
  year: string;
  url?: string;
  solutionUrl?: string;
  authors?: {
    crsid: string;
    name: string;
  }[];
  paperYear: {
    triposPart?: {
      name: string;
      code: string;
    };
  };
  course: PatchCourseYearData;
};

export const getOrPatchTripos = async () => {
  if (cache.tripos.has("CST")) {
    const cached = cache.tripos.get("CST");
    if (cached) return cached;
  }

  const tripos = await db.query.triposTable.findFirst({
    where: eq(triposTable.code, "CST")
  });
  if (tripos) {
    cache.tripos.set("CST", tripos);
    return tripos;
  }

  const newTripos = await db
    .insert(triposTable)
    .values({
      code: "CST",
      name: "Computer Science Tripos"
    })
    .returning();

  if (newTripos.length !== 1) throw new Error("Failed to create tripos CST");

  cache.tripos.set("CST", newTripos[0]);
  return newTripos[0];
};

export const getOrPatchPaper = async (data: PatchQuestionData) => {
  if (cache.papers.has(data.paper)) {
    const cached = cache.papers.get(data.paper);
    if (cached) return cached;
  }

  const paper = await db.query.paperTable.findFirst({
    where: eq(paperTable.name, data.paper)
  });
  if (paper) {
    cache.papers.set(data.paper, paper);
    return paper;
  }

  const tripos = await getOrPatchTripos();

  const newPaper = await db
    .insert(paperTable)
    .values({
      name: data.paper,
      triposId: tripos.id
    })
    .returning();

  if (newPaper.length !== 1)
    throw new Error(`Failed to create paper ${data.paper}`);

  cache.papers.set(data.paper, newPaper[0]);
  return newPaper[0];
};

export const getOrPatchTriposPart = async (data: PatchQuestionData) => {
  if (!data.paperYear.triposPart) {
    return null;
  }

  if (cache.triposParts.has(data.paperYear.triposPart.code)) {
    const cached = cache.triposParts.get(data.paperYear.triposPart.code);
    if (cached) return cached;
  }

  const triposPart = await db.query.triposPartTable.findFirst({
    where: eq(triposPartTable.code, data.paperYear.triposPart.code)
  });
  if (triposPart) {
    cache.triposParts.set(data.paperYear.triposPart.code, triposPart);
    return triposPart;
  }

  const tripos = await getOrPatchTripos();

  const newTriposPart = await db
    .insert(triposPartTable)
    .values({
      name: data.paperYear.triposPart.name,
      code: data.paperYear.triposPart.code,
      triposId: tripos.id
    })
    .returning();

  if (newTriposPart.length !== 1)
    throw new Error(
      `Failed to create tripos part ${data.paperYear.triposPart.code}`
    );

  cache.triposParts.set(data.paperYear.triposPart.code, newTriposPart[0]);
  return newTriposPart[0];
};

export const getOrPatchTriposPartYear = async (data: PatchQuestionData) => {
  if (!data.paperYear.triposPart) {
    return null;
  }

  if (
    cache.triposPartYears.has(
      [data.paperYear.triposPart.code, data.year].join(":")
    )
  ) {
    const cached = cache.triposPartYears.get(
      [data.paperYear.triposPart.code, data.year].join(":")
    );
    if (cached) return cached;
  }

  const triposPart = await getOrPatchTriposPart(data);

  if (!triposPart) {
    return null;
  }

  const triposPartYear = await db.query.triposPartYearTable.findFirst({
    where: and(
      eq(triposPartYearTable.triposPartId, triposPart.id),
      eq(triposPartYearTable.year, Number.parseInt(data.year))
    )
  });

  if (triposPartYear) {
    cache.triposPartYears.set(
      [data.paperYear.triposPart.code, data.year].join(":"),
      triposPartYear
    );
    return triposPartYear;
  }

  const newTriposPartYear = await db
    .insert(triposPartYearTable)
    .values({
      year: Number.parseInt(data.year),
      triposPartId: triposPart.id
    })
    .returning();

  if (newTriposPartYear.length !== 1)
    throw new Error(
      `Failed to create tripos part year ${data.paperYear.triposPart.code} ${data.year}`
    );

  cache.triposPartYears.set(
    [data.paperYear.triposPart.code, data.year].join(":"),
    newTriposPartYear[0]
  );
  return newTriposPartYear[0];
};

export const getOrPatchPaperYear = async (data: PatchQuestionData) => {
  const paper = await getOrPatchPaper(data);

  if (cache.paperYears.has([paper.id, data.year].join(":"))) {
    const cached = cache.paperYears.get([paper.id, data.year].join(":"));
    if (cached) return cached;
  }

  const paperYear = await db.query.paperYearTable.findFirst({
    where: and(
      eq(paperYearTable.paperId, paper.id),
      eq(paperYearTable.year, Number.parseInt(data.year))
    )
  });
  if (paperYear) {
    cache.paperYears.set([paper.id, data.year].join(":"), paperYear);
    return paperYear;
  }

  const triposPartYear = await getOrPatchTriposPartYear(data);

  const newPaperYear = await db
    .insert(paperYearTable)
    .values({
      year: Number.parseInt(data.year),
      paperId: paper.id,
      triposPartYearId: triposPartYear?.id,
      url: `https://www.cl.cam.ac.uk/teaching/exams/pastpapers/y${data.year}PAPER${paper.name}.pdf`
    })
    .returning();

  cache.paperYears.set([paper.id, data.year].join(":"), newPaperYear[0]);
  return newPaperYear[0];
};

export const getOrPatchCourse = async (data: PatchQuestionData) => {
  if (cache.courses.has(data.course.course.code)) {
    const cached = cache.courses.get(data.course.course.code);
    if (cached) return cached;
  }

  const course = await db.query.courseTable.findFirst({
    where: eq(courseTable.code, data.course.course.code)
  });
  if (course) {
    cache.courses.set(data.course.course.code, course);
    return course;
  }

  const newCourse = await db
    .insert(courseTable)
    .values({
      name: data.course.course.name,
      code: data.course.course.code
    })
    .returning();

  if (newCourse.length !== 1)
    throw new Error(`Failed to create course ${data.course.course.code}`);

  cache.courses.set(data.course.course.code, newCourse[0]);
  return newCourse[0];
};

export const getOrPatchCourseYear = async (data: PatchQuestionData) => {
  const paperYear = await getOrPatchPaperYear(data);
  const course = await getOrPatchCourse(data);

  if (cache.courseYears.has([course.id, data.year].join(":"))) {
    const cached = cache.courseYears.get([course.id, data.year].join(":"));
    if (cached) return cached;
  }

  const courseYear = await db.query.courseYearTable.findFirst({
    where: and(
      eq(courseYearTable.courseId, course.id),
      eq(courseYearTable.year, Number.parseInt(data.year))
    )
  });

  if (courseYear) {
    cache.courseYears.set([course.id, data.year].join(":"), courseYear);
    return courseYear;
  }

  const newCourseYear = await db
    .insert(courseYearTable)
    .values({
      year: Number.parseInt(data.year),
      courseId: course.id,
      url: data.course.url,
      michaelmas: data.course.michaelmas,
      lent: data.course.lent,
      easter: data.course.easter,
      lectures: data.course.lectures,
      moodleId: data.course.moodleId,
      suggestedSupervisions: data.course.suggestedSupervisions,
      format: data.course.format
    })
    .returning();

  if (newCourseYear.length !== 1)
    throw new Error(`Failed to create course year ${course.id} ${data.year}`);

  for (const lecturer of data.course.lecturers ?? []) {
    const user = await getOrPatchUser(lecturer.crsid, { name: lecturer.name });
    await db.insert(courseYearLecturerTable).values({
      courseYearId: newCourseYear[0].id,
      lecturerId: user.id
    });
  }

  cache.courseYears.set([course.id, data.year].join(":"), newCourseYear[0]);
  return newCourseYear[0];
};

export const getOrPatchCourseYearPaperYear = async (
  data: PatchQuestionData
) => {
  const paperYear = await getOrPatchPaperYear(data);
  const courseYear = await getOrPatchCourseYear(data);

  const courseYearPaperYear = await db.query.courseYearPaperYearTable.findFirst(
    {
      where: and(
        eq(courseYearPaperYearTable.courseYearId, courseYear.id),
        eq(courseYearPaperYearTable.paperYearId, paperYear.id)
      )
    }
  );

  if (courseYearPaperYear) {
    return courseYearPaperYear;
  }

  const newCourseYearPaperYear = await db
    .insert(courseYearPaperYearTable)
    .values({
      courseYearId: courseYear.id,
      paperYearId: paperYear.id
    })
    .returning();

  if (newCourseYearPaperYear.length !== 1)
    throw new Error(
      `Failed to create course year paper year ${courseYear.id} ${paperYear.id}`
    );

  return newCourseYearPaperYear[0];
};

export const getOrPatchQuestion = async (data: PatchQuestionData) => {
  const paperYear = await getOrPatchPaperYear(data);
  const courseYear = await getOrPatchCourseYear(data);
  await getOrPatchCourseYearPaperYear(data);

  const authors = await Promise.all(
    data.authors?.map((author) =>
      getOrPatchUser(author.crsid, { name: author.name })
    ) ?? []
  );

  if (
    cache.questions.has(
      [paperYear.id, courseYear.id, data.questionNumber].join(":")
    )
  ) {
    const cached = cache.questions.get(
      [paperYear.id, courseYear.id, data.questionNumber].join(":")
    );
    if (cached) return cached;
  }

  const question = await db.query.questionTable.findFirst({
    where: and(
      eq(questionTable.paperYearId, paperYear.id),
      eq(questionTable.courseYearId, courseYear.id),
      eq(questionTable.questionNumber, Number.parseInt(data.questionNumber))
    )
  });

  if (question) {
    return question;
  }

  const newQuestion = await db
    .insert(questionTable)
    .values({
      paperYearId: paperYear.id,
      courseYearId: courseYear.id,
      questionNumber: Number.parseInt(data.questionNumber),
      solutionUrl: data.solutionUrl ?? "",
      url: data.url ?? ""
    })
    .returning();

  await Promise.all(
    authors.map((author) =>
      db.insert(questionAuthorTable).values({
        questionId: newQuestion[0].id,
        authorId: author.id
      })
    )
  );

  if (newQuestion.length !== 1)
    throw new Error(
      `Failed to create question ${paperYear.id} ${courseYear.id} ${data.questionNumber}`
    );

  await uploadQuestionToVectorDb(newQuestion[0]);

  cache.questions.set(
    [paperYear.id, courseYear.id, data.questionNumber].join(":"),
    newQuestion[0]
  );
  return newQuestion[0];
};

export const resetDatabase = async () => {
  console.log("Resetting database...");
  await db.delete(questionAuthorTable);
  await db.delete(courseYearLecturerTable);
  await db.delete(userQuestionAnswerTable);
  await db.delete(questionTable);
  await db.delete(courseYearPaperYearTable);
  await db.delete(courseYearTable);
  await db.delete(paperYearTable);
  await db.delete(triposPartYearTable);
  await db.delete(triposPartTable);
  await db.delete(paperTable);
  await db.delete(triposTable);
  await db.delete(courseTable);
  await db.delete(userSettingsTable);
  await db.delete(usersTable);
  console.log("Database reset");
};
