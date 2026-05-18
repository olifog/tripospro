import { Pinecone } from "@pinecone-database/pinecone";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "@/db";
import { courseTable, courseYearTable } from "@/db/schema/course";
import { paperTable, paperYearTable } from "@/db/schema/paper";
import { questionTable } from "@/db/schema/question";
import { topicTable } from "@/db/schema/topic";
import { triposPartTable, triposPartYearTable } from "@/db/schema/tripos";
import { env } from "@/env";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

const index = pinecone.Index("questions", env.PINECONE_HOST);

type SearchResult = {
  id: string;
  type: "course" | "question" | "paper" | "topic";
  title: string;
  subtitle?: string;
  href: string;
  score: number;
  source: "exact" | "fuzzy" | "semantic";
  meta?: {
    year?: number;
    paperNumber?: string;
    questionNumber?: number;
    courseName?: string;
    medianMark?: number | null;
  };
};

const QUESTION_PATTERN = /^(?:p|paper\s*)(\d+)\s*(?:q|question\s*)(\d+)$/i;
const YEAR_QUESTION_PATTERN =
  /^(\d{4})\s*(?:p|paper\s*)(\d+)\s*(?:q|question\s*)(\d+)$/i;
const PAPER_PATTERN = /^(?:p|paper\s*)(\d+)(?:\s+(\d{4}))?$/i;
const YEAR_PATTERN = /^(\d{4})$/;

function parseStructuredQuery(query: string): {
  paperNumber?: string;
  questionNumber?: number;
  year?: number;
} | null {
  const trimmed = query.trim();

  const yqMatch = trimmed.match(YEAR_QUESTION_PATTERN);
  if (yqMatch) {
    return {
      year: parseInt(yqMatch[1]),
      paperNumber: yqMatch[2],
      questionNumber: parseInt(yqMatch[3])
    };
  }

  const qMatch = trimmed.match(QUESTION_PATTERN);
  if (qMatch) {
    return {
      paperNumber: qMatch[1],
      questionNumber: parseInt(qMatch[2])
    };
  }

  const pMatch = trimmed.match(PAPER_PATTERN);
  if (pMatch) {
    return {
      paperNumber: pMatch[1],
      year: pMatch[2] ? parseInt(pMatch[2]) : undefined
    };
  }

  return null;
}

export const searchRouter = createTRPCRouter({
  courses: baseProcedure.query(async () => {
    const courses = await db
      .select({
        id: courseTable.id,
        name: courseTable.name,
        code: courseTable.code
      })
      .from(courseTable);
    return courses;
  }),

  hybrid: protectedProcedure
    .input(z.object({ query: z.string().min(2).max(200) }))
    .query(async ({ input }) => {
      const query = input.query.trim();
      const results: SearchResult[] = [];

      const structuredParse = parseStructuredQuery(query);

      const [structuredResults, fuzzyResults, semanticResults] =
        await Promise.all([
          getStructuredResults(query, structuredParse),
          structuredParse ? Promise.resolve([]) : getFuzzyResults(query),
          getSemanticResults(query)
        ]);

      const seen = new Set<string>();

      for (const r of structuredResults) {
        seen.add(r.id);
        results.push(r);
      }

      for (const r of fuzzyResults) {
        if (seen.has(r.id)) {
          const existing = results.find((e) => e.id === r.id);
          if (existing) existing.score = Math.max(existing.score, r.score);
          continue;
        }
        seen.add(r.id);
        results.push(r);
      }

      for (const r of semanticResults) {
        if (seen.has(r.id)) {
          const existing = results.find((e) => e.id === r.id);
          if (existing) existing.score = Math.max(existing.score, r.score * 0.6);
          continue;
        }
        seen.add(r.id);
        results.push({ ...r, score: r.score * 0.6 });
      }

      results.sort((a, b) => b.score - a.score);

      return results.slice(0, 15);
    })
});

async function getStructuredResults(
  query: string,
  parsed: ReturnType<typeof parseStructuredQuery>
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (!parsed) {
    const yearMatch = query.match(YEAR_PATTERN);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year < 1993 || year > 2100) return results;
      const paperYears = await db
        .select({
          paperId: paperYearTable.paperId,
          paperName: paperTable.name,
          year: paperYearTable.year,
          triposPartName: triposPartTable.name
        })
        .from(paperYearTable)
        .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
        .leftJoin(
          triposPartYearTable,
          eq(paperYearTable.triposPartYearId, triposPartYearTable.id)
        )
        .leftJoin(
          triposPartTable,
          eq(triposPartYearTable.triposPartId, triposPartTable.id)
        )
        .where(eq(paperYearTable.year, year))
        .limit(10);

      for (const py of paperYears) {
        results.push({
          id: `paper-${py.paperId}-${py.year}`,
          type: "paper",
          title: `Paper ${py.paperName} (${py.year})`,
          subtitle: py.triposPartName ?? undefined,
          href: `/questions?year=${py.year}&paper=${py.paperName}`,
          score: 1.0,
          source: "exact",
          meta: { year: py.year, paperNumber: py.paperName }
        });
      }
    }
    return results;
  }

  if (parsed.paperNumber && parsed.questionNumber) {
    const conditions = [
      eq(paperTable.name, parsed.paperNumber),
      eq(questionTable.questionNumber, parsed.questionNumber)
    ];

    if (parsed.year) {
      conditions.push(eq(paperYearTable.year, parsed.year));
    }

    const questions = await db
      .select({
        questionId: questionTable.id,
        questionNumber: questionTable.questionNumber,
        paperName: paperTable.name,
        year: paperYearTable.year,
        courseName: courseTable.name,
        medianMark: questionTable.medianMark
      })
      .from(questionTable)
      .innerJoin(paperYearTable, eq(questionTable.paperYearId, paperYearTable.id))
      .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
      .leftJoin(courseYearTable, eq(questionTable.courseYearId, courseYearTable.id))
      .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
      .where(and(...conditions))
      .limit(10);

    for (const q of questions) {
      results.push({
        id: `question-${q.questionId}`,
        type: "question",
        title: `${q.year} Paper ${q.paperName} Question ${q.questionNumber}`,
        subtitle: q.courseName ?? undefined,
        href: `/p/${q.paperName}/${q.year}/${q.questionNumber}`,
        score: 1.0,
        source: "exact",
        meta: {
          year: q.year,
          paperNumber: q.paperName,
          questionNumber: q.questionNumber,
          courseName: q.courseName ?? undefined,
          medianMark: q.medianMark
        }
      });
    }
  } else if (parsed.paperNumber) {
    const conditions = [eq(paperTable.name, parsed.paperNumber)];
    if (parsed.year) {
      conditions.push(eq(paperYearTable.year, parsed.year));
    }

    const papers = await db
      .select({
        paperId: paperYearTable.paperId,
        paperName: paperTable.name,
        year: paperYearTable.year,
        triposPartName: triposPartTable.name
      })
      .from(paperYearTable)
      .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
      .leftJoin(
        triposPartYearTable,
        eq(paperYearTable.triposPartYearId, triposPartYearTable.id)
      )
      .leftJoin(
        triposPartTable,
        eq(triposPartYearTable.triposPartId, triposPartTable.id)
      )
      .where(and(...conditions))
      .limit(10);

    for (const p of papers) {
      results.push({
        id: `paper-${p.paperId}-${p.year}`,
        type: "paper",
        title: `Paper ${p.paperName} (${p.year})`,
        subtitle: p.triposPartName ?? undefined,
        href: `/questions?year=${p.year}&paper=${p.paperName}`,
        score: 1.0,
        source: "exact",
        meta: { year: p.year, paperNumber: p.paperName }
      });
    }
  }

  return results;
}

async function getFuzzyResults(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const sanitized = query.replace(/[%_\\]/g, "\\$&");

  const courses = await db
    .select({
      id: courseTable.id,
      name: courseTable.name,
      code: courseTable.code
    })
    .from(courseTable)
    .where(
      or(
        ilike(courseTable.name, `%${sanitized}%`),
        ilike(courseTable.code, `%${sanitized}%`)
      )
    )
    .limit(8);

  for (const course of courses) {
    const nameLC = course.name.toLowerCase();
    const queryLC = query.toLowerCase();
    const isPrefix = nameLC.startsWith(queryLC);
    const score = isPrefix ? 0.9 : 0.75;

    results.push({
      id: `course-${course.id}`,
      type: "course",
      title: course.name,
      subtitle: course.code,
      href: `/course/${course.id}`,
      score,
      source: "fuzzy"
    });
  }

  const topics = await db
    .select({
      topicId: topicTable.id,
      topicName: topicTable.name,
      courseId: topicTable.courseId,
      courseName: courseTable.name
    })
    .from(topicTable)
    .innerJoin(courseTable, eq(topicTable.courseId, courseTable.id))
    .where(ilike(topicTable.name, `%${sanitized}%`))
    .limit(5);

  for (const topic of topics) {
    results.push({
      id: `topic-${topic.topicId}`,
      type: "topic",
      title: topic.topicName,
      subtitle: topic.courseName,
      href: `/course/${topic.courseId}`,
      score: 0.7,
      source: "fuzzy"
    });
  }

  return results;
}

async function getSemanticResults(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const vector = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });

    const searchResults = await index.query({
      vector: vector.data[0].embedding,
      topK: 8,
      includeMetadata: true,
      includeValues: false
    });

    const questionIds = searchResults.matches
      .filter((m) => m.score && m.score > 0.3)
      .map((m) => ({
        pineconeId: m.id,
        score: m.score!,
        metadata: m.metadata as Record<string, unknown> | undefined
      }));

    if (questionIds.length > 0) {
      const dbIds = questionIds
        .map((q) => parseInt(q.pineconeId))
        .filter((id) => !isNaN(id));

      if (dbIds.length > 0) {
        const questions = await db
          .select({
            questionId: questionTable.id,
            questionNumber: questionTable.questionNumber,
            paperName: paperTable.name,
            year: paperYearTable.year,
            courseName: courseTable.name,
            medianMark: questionTable.medianMark
          })
          .from(questionTable)
          .innerJoin(
            paperYearTable,
            eq(questionTable.paperYearId, paperYearTable.id)
          )
          .innerJoin(paperTable, eq(paperYearTable.paperId, paperTable.id))
          .leftJoin(
            courseYearTable,
            eq(questionTable.courseYearId, courseYearTable.id)
          )
          .leftJoin(courseTable, eq(courseYearTable.courseId, courseTable.id))
          .where(inArray(questionTable.id, dbIds));

        for (const q of questions) {
          const pineconeMatch = questionIds.find(
            (p) => parseInt(p.pineconeId) === q.questionId
          );
          const score = pineconeMatch?.score ?? 0.5;

          results.push({
            id: `question-${q.questionId}`,
            type: "question",
            title: `${q.year} Paper ${q.paperName} Question ${q.questionNumber}`,
            subtitle: q.courseName ?? undefined,
            href: `/p/${q.paperName}/${q.year}/${q.questionNumber}`,
            score,
            source: "semantic",
            meta: {
              year: q.year,
              paperNumber: q.paperName,
              questionNumber: q.questionNumber,
              courseName: q.courseName ?? undefined,
              medianMark: q.medianMark
            }
          });
        }
      }
    }
  } catch (e) {
    // Semantic search is a nice-to-have; don't fail the whole search
    console.error("Semantic search failed:", e);
  }

  return results;
}
