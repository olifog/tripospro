import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { Command } from "commander";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { courseTable, courseYearTable } from "@/db/schema/course";
import { paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { courseInsightTable } from "@/db/schema/topic";

const MODEL_ID = "gpt-4o";
const MIN_COMMENTS = 3;

const SYSTEM_PROMPT = `You are an expert academic advisor helping Cambridge Computer Science students prepare for their Tripos exams.

You will be given a collection of examiner comments for a specific course, organized by year. These comments describe how students performed on exam questions, what mistakes they made, and what the examiners were looking for.

Your task is to synthesize these into a concise, actionable study guide that helps students understand:
1. What examiners consistently look for in strong answers
2. Common mistakes to avoid
3. Patterns and trends over time

Guidelines for your output:
- Write in clear, concise markdown with headers and bullet points
- Be specific and actionable — vague advice is useless
- Quote examiner comments directly where they illustrate a point (cite the year in parentheses)
- Focus on patterns that appear across multiple years, not one-off observations
- If there are clear trends over time (e.g., expectations increasing, new topics appearing), note them
- Keep the total output under 1500 words — students need quick, scannable guidance
- Do NOT include an introduction or conclusion paragraph — jump straight into the insights
- Use ## headers for main sections`;

interface CommentsByYear {
  [year: number]: { questionNumber: number; comment: string }[];
}

async function getCoursesWithComments(courseFilter?: string) {
  // Get all courses, optionally filtered
  let courses: { id: number; name: string; code: string }[];

  if (courseFilter) {
    // Try matching by ID first, then by name/code
    const asNumber = Number.parseInt(courseFilter, 10);
    if (!Number.isNaN(asNumber)) {
      courses = await db
        .select({
          id: courseTable.id,
          name: courseTable.name,
          code: courseTable.code
        })
        .from(courseTable)
        .where(eq(courseTable.id, asNumber));
    } else {
      courses = await db
        .select({
          id: courseTable.id,
          name: courseTable.name,
          code: courseTable.code
        })
        .from(courseTable)
        .where(
          sql`lower(${courseTable.name}) LIKE lower(${`%${courseFilter}%`}) OR lower(${courseTable.code}) LIKE lower(${`%${courseFilter}%`})`
        );
    }
  } else {
    courses = await db
      .select({
        id: courseTable.id,
        name: courseTable.name,
        code: courseTable.code
      })
      .from(courseTable);
  }

  return courses;
}

async function getCommentsForCourse(courseId: number): Promise<CommentsByYear> {
  const rows = await db
    .select({
      year: paperYearTable.year,
      questionNumber: questionTable.questionNumber,
      examinerComment: questionTable.examinerComment
    })
    .from(questionTable)
    .innerJoin(
      courseYearTable,
      eq(questionTable.courseYearId, courseYearTable.id)
    )
    .innerJoin(paperYearTable, eq(questionTable.paperYearId, paperYearTable.id))
    .where(
      and(
        eq(courseYearTable.courseId, courseId),
        isNotNull(questionTable.examinerComment)
      )
    )
    .orderBy(paperYearTable.year, questionTable.questionNumber);

  const commentsByYear: CommentsByYear = {};
  for (const row of rows) {
    if (!row.examinerComment || !row.year) continue;
    if (!commentsByYear[row.year]) {
      commentsByYear[row.year] = [];
    }
    commentsByYear[row.year].push({
      questionNumber: row.questionNumber,
      comment: row.examinerComment
    });
  }

  return commentsByYear;
}

function formatCommentsForPrompt(
  courseName: string,
  commentsByYear: CommentsByYear
): string {
  const years = Object.keys(commentsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  let prompt = `# Examiner Comments for: ${courseName}\n\n`;

  for (const year of years) {
    prompt += `## ${year}\n`;
    for (const { questionNumber, comment } of commentsByYear[year]) {
      prompt += `- **Q${questionNumber}:** ${comment}\n`;
    }
    prompt += "\n";
  }

  return prompt;
}

async function generateInsight(
  courseName: string,
  commentsByYear: CommentsByYear
): Promise<string> {
  const userPrompt = formatCommentsForPrompt(courseName, commentsByYear);

  const { text } = await generateText({
    model: openai(MODEL_ID),
    system: SYSTEM_PROMPT,
    prompt: userPrompt
  });

  return text;
}

const insightsCommand = new Command("insights")
  .description("Generate examiner comment insights per course using LLM")
  .option("-c, --course <course>", "Run for a single course (by ID or name)")
  .action(async (options) => {
    const courses = await getCoursesWithComments(options.course);

    if (courses.length === 0) {
      console.log("No courses found matching the filter.");
      return;
    }

    console.log(`Found ${courses.length} course(s) to process.\n`);

    let processed = 0;
    let skipped = 0;

    for (const course of courses) {
      console.log(
        `[${processed + skipped + 1}/${courses.length}] Processing: ${course.name} (id=${course.id})`
      );

      const commentsByYear = await getCommentsForCourse(course.id);
      const totalComments = Object.values(commentsByYear).reduce(
        (sum, comments) => sum + comments.length,
        0
      );
      const yearsCount = Object.keys(commentsByYear).length;

      if (totalComments < MIN_COMMENTS) {
        console.log(
          `  Skipping — only ${totalComments} comment(s) (need at least ${MIN_COMMENTS})\n`
        );
        skipped++;
        continue;
      }

      console.log(
        `  ${totalComments} comments across ${yearsCount} year(s). Generating insight...`
      );

      const content = await generateInsight(course.name, commentsByYear);
      const now = new Date();

      // Upsert: insert or update on conflict
      await db
        .insert(courseInsightTable)
        .values({
          courseId: course.id,
          content,
          generatedAt: now,
          modelUsed: MODEL_ID,
          yearsAnalyzed: yearsCount,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [courseInsightTable.courseId],
          set: {
            content,
            generatedAt: now,
            modelUsed: MODEL_ID,
            yearsAnalyzed: yearsCount,
            updatedAt: now
          }
        });

      console.log(`  Done. Stored insight (${content.length} chars).\n`);
      processed++;
    }

    console.log(`\nFinished. Processed: ${processed}, Skipped: ${skipped}`);
  });

export { insightsCommand };
