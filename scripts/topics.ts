import { openai } from "@ai-sdk/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateObject } from "ai";
import { Command } from "commander";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { courseTable, courseYearTable } from "@/db/schema/course";
import { questionTable } from "@/db/schema/question";
import { questionTopicTable, topicTable } from "@/db/schema/topic";
import { env } from "@/env";

// --- Pinecone setup ---

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});
const index = pc.index("questions");

// --- Zod schemas for LLM structured output ---

const topicBucketsSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string().describe("Human-readable topic name"),
      slug: z
        .string()
        .describe(
          "URL-safe slug, lowercase, hyphens only, no special characters"
        )
    })
  )
});

const topicAssignmentSchema = z.object({
  assignments: z.array(
    z.object({
      questionId: z.number(),
      topics: z.array(
        z.object({
          slug: z.string(),
          confidence: z
            .number()
            .min(0)
            .max(1)
            .describe("How confident the assignment is, 0-1")
        })
      )
    })
  )
});

// --- Pinecone batch fetch ---

async function fetchQuestionTexts(
  questionIds: number[]
): Promise<Map<number, string>> {
  const texts = new Map<number, string>();

  // Pinecone fetch supports up to 1000 IDs at a time
  const batchSize = 1000;
  for (let i = 0; i < questionIds.length; i += batchSize) {
    const batchIds = questionIds.slice(i, i + batchSize);
    const response = await index.fetch({
      ids: batchIds.map((id) => id.toString())
    });

    for (const [id, record] of Object.entries(response.records)) {
      const text = record.metadata?.text as string | undefined;
      if (text) {
        texts.set(Number.parseInt(id, 10), text);
      }
    }
  }

  return texts;
}

// --- Phase 1: Generate topic buckets for a course ---

async function generateTopicBuckets(
  courseName: string,
  questionTexts: Map<number, string>
): Promise<z.infer<typeof topicBucketsSchema>> {
  const allTexts = Array.from(questionTexts.entries())
    .map(([id, text]) => `--- Question ${id} ---\n${text}`)
    .join("\n\n");

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: topicBucketsSchema,
    system: `You are an expert in Cambridge Computer Science curriculum analysis. Given a list of exam question texts from a specific course, identify the key distinct topics and subtopics that are examined.

Rules:
- Identify between 5 and 15 distinct topic areas
- Topics should be specific enough to be useful for categorisation but broad enough that multiple questions fall under each
- Use clear, concise names that a student would recognise
- Generate URL-safe slugs (lowercase, hyphens, no special characters)
- Do NOT include the course name itself as a topic
- Focus on the conceptual areas being tested, not question format`,
    prompt: `Here are all exam questions from the Cambridge Computer Science course "${courseName}". Identify the key topic areas covered across these questions.

${allTexts}`
  });

  return result.object;
}

// --- Phase 2: Assign topics to questions ---

async function assignTopicsToQuestions(
  courseName: string,
  topicSlugs: { name: string; slug: string }[],
  questionTexts: Map<number, string>
): Promise<z.infer<typeof topicAssignmentSchema>> {
  const entries = Array.from(questionTexts.entries());
  const allAssignments: z.infer<typeof topicAssignmentSchema>["assignments"] =
    [];

  // Batch questions 25 at a time
  const batchSize = 25;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    const batchTexts = batch
      .map(([id, text]) => `--- Question ${id} ---\n${text}`)
      .join("\n\n");

    const topicList = topicSlugs
      .map((t) => `- ${t.slug} (${t.name})`)
      .join("\n");

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: topicAssignmentSchema,
      system: `You are an expert in Cambridge Computer Science curriculum analysis. Given exam questions and a list of available topics, assign 1-3 topics to each question.

Rules:
- Each question must be assigned at least 1 and at most 3 topics
- Only use topic slugs from the provided list
- Set confidence between 0 and 1 (1 = very clearly about this topic, 0.5 = partially related)
- Be precise: only assign a topic if the question genuinely tests knowledge in that area`,
      prompt: `Course: "${courseName}"

Available topics:
${topicList}

Assign topics to each of the following questions. Use the question IDs exactly as shown.

${batchTexts}`
    });

    allAssignments.push(...result.object.assignments);

    console.log(
      `    Assigned topics to batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)}`
    );
  }

  return { assignments: allAssignments };
}

// --- Main orchestration ---

async function processCourseTopic(
  course: { id: number; name: string },
  force: boolean
) {
  console.log(`\n[Course] ${course.name} (id=${course.id})`);

  // Get all question IDs for this course via courseYear
  const courseYears = await db
    .select({ id: courseYearTable.id })
    .from(courseYearTable)
    .where(eq(courseYearTable.courseId, course.id));

  if (courseYears.length === 0) {
    console.log("  No course years found, skipping.");
    return;
  }

  const courseYearIds = courseYears.map((cy) => cy.id);

  const questions = await db
    .select({ id: questionTable.id })
    .from(questionTable)
    .where(inArray(questionTable.courseYearId, courseYearIds));

  if (questions.length === 0) {
    console.log("  No questions found, skipping.");
    return;
  }

  const questionIds = questions.map((q) => q.id);
  console.log(
    `  Found ${questionIds.length} questions across ${courseYears.length} course years.`
  );

  // Check for existing topics if not forcing
  const existingTopics = await db
    .select({ id: topicTable.id })
    .from(topicTable)
    .where(eq(topicTable.courseId, course.id));

  if (existingTopics.length > 0 && !force) {
    console.log(
      `  Already has ${existingTopics.length} topics. Use --force to re-run.`
    );
    return;
  }

  // Clear existing data if forcing
  if (existingTopics.length > 0 && force) {
    console.log("  Clearing existing topics (--force)...");
    const topicIds = existingTopics.map((t) => t.id);
    await db
      .delete(questionTopicTable)
      .where(inArray(questionTopicTable.topicId, topicIds));
    await db.delete(topicTable).where(eq(topicTable.courseId, course.id));
  }

  // Fetch question texts from Pinecone
  console.log("  Fetching question texts from Pinecone...");
  const questionTexts = await fetchQuestionTexts(questionIds);
  console.log(
    `  Got text for ${questionTexts.size}/${questionIds.length} questions.`
  );

  if (questionTexts.size === 0) {
    console.log("  No question texts available in Pinecone, skipping.");
    return;
  }

  // Phase 1: Generate topic buckets
  console.log("  Phase 1: Generating topic buckets...");
  const { topics } = await generateTopicBuckets(course.name, questionTexts);
  console.log(`  Generated ${topics.length} topics:`);
  for (const topic of topics) {
    console.log(`    - ${topic.name} (${topic.slug})`);
  }

  // Insert topics into DB
  const insertedTopics = await db
    .insert(topicTable)
    .values(
      topics.map((t) => ({
        courseId: course.id,
        name: t.name,
        slug: t.slug
      }))
    )
    .returning({ id: topicTable.id, slug: topicTable.slug });

  const topicSlugToId = new Map(insertedTopics.map((t) => [t.slug, t.id]));

  // Phase 2: Assign topics to questions
  console.log("  Phase 2: Assigning topics to questions...");
  const { assignments } = await assignTopicsToQuestions(
    course.name,
    topics,
    questionTexts
  );

  // Insert assignments into DB
  const questionTopicValues: {
    questionId: number;
    topicId: number;
    confidence: number;
  }[] = [];

  const validQuestionIds = new Set(questionIds);
  for (const assignment of assignments) {
    if (!validQuestionIds.has(assignment.questionId)) continue;
    for (const topicAssignment of assignment.topics) {
      const topicId = topicSlugToId.get(topicAssignment.slug);
      if (topicId) {
        questionTopicValues.push({
          questionId: assignment.questionId,
          topicId,
          confidence: topicAssignment.confidence
        });
      }
    }
  }

  if (questionTopicValues.length > 0) {
    // Insert in batches to avoid hitting query limits
    const insertBatchSize = 500;
    for (let i = 0; i < questionTopicValues.length; i += insertBatchSize) {
      const batch = questionTopicValues.slice(i, i + insertBatchSize);
      await db.insert(questionTopicTable).values(batch).onConflictDoNothing();
    }
  }

  console.log(
    `  Done! Assigned ${questionTopicValues.length} topic-question links.`
  );
}

// --- Commander command ---

export const topicsCommand = new Command("topics")
  .description("Generate and assign topic tags to questions using LLM")
  .option("--course <courseId>", "Process a single course by ID or name")
  .option("--force", "Re-generate topics even if they already exist", false)
  .action(async (options) => {
    const force = options.force as boolean;

    let courses: { id: number; name: string }[];

    if (options.course) {
      // Try to match by ID first, then by name
      const courseIdNum = Number.parseInt(options.course, 10);
      if (!Number.isNaN(courseIdNum)) {
        courses = await db
          .select({ id: courseTable.id, name: courseTable.name })
          .from(courseTable)
          .where(eq(courseTable.id, courseIdNum));
      } else {
        courses = await db
          .select({ id: courseTable.id, name: courseTable.name })
          .from(courseTable)
          .where(eq(courseTable.name, options.course));
      }

      if (courses.length === 0) {
        console.error(`Course not found: ${options.course}`);
        process.exit(1);
      }
    } else {
      courses = await db
        .select({ id: courseTable.id, name: courseTable.name })
        .from(courseTable);
    }

    console.log(`Processing ${courses.length} course(s)...`);

    for (const course of courses) {
      await processCourseTopic(course, force);
    }

    console.log("\nAll done!");
    process.exit(0);
  });
