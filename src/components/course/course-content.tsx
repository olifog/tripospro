"use client";

import { ExternalLink, Info, Lightbulb, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Markdown from "react-markdown";
import { markTextColorStyle } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { CommentThread } from "../comment";
import { ErrorMessage } from "../error";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";

export const CourseContent = ({ courseId }: { courseId: number }) => {
  return (
    <ErrorBoundary
      fallback={<ErrorMessage title="Failed to load course" description="" />}
    >
      <Suspense fallback={<CourseContentSkeleton />}>
        <CourseContentInner courseId={courseId} />
      </Suspense>
    </ErrorBoundary>
  );
};

const CourseContentSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const CourseContentInner = ({ courseId }: { courseId: number }) => {
  const [course] = trpc.course.getCourse.useSuspenseQuery({ courseId });

  const globalCurrentYear = course.globalCurrentYear;

  const isCourseCurrentlyTaught = useMemo(() => {
    return (
      globalCurrentYear !== null &&
      course.years.some((y) => y.year === globalCurrentYear)
    );
  }, [course.years, globalCurrentYear]);

  const latestYearData = useMemo(() => {
    return course.years.length > 0 ? course.years[0] : null;
  }, [course.years]);

  const weightedOverallStats = useMemo(() => {
    const yearsWithStats = course.years.filter((y) => y.marksStats !== null);
    if (yearsWithStats.length === 0) return null;

    const sorted = [...yearsWithStats].sort((a, b) => b.year - a.year);
    const lambda = 0.3;
    let totalWeight = 0;
    let weightedMin = 0;
    let weightedMedian = 0;
    let weightedMax = 0;

    sorted.forEach((year, index) => {
      const weight = Math.exp(-lambda * index);
      totalWeight += weight;
      weightedMin += year.marksStats!.avgMinMark * weight;
      weightedMedian += year.marksStats!.avgMedianMark * weight;
      weightedMax += year.marksStats!.avgMaxMark * weight;
    });

    const yearsWithPopularity = course.years.filter(
      (y) => y.popularity !== null
    );
    let weightedPopularity: number | null = null;
    if (yearsWithPopularity.length > 0) {
      const sortedPop = [...yearsWithPopularity].sort(
        (a, b) => b.year - a.year
      );
      let popTotalWeight = 0;
      let popWeightedSum = 0;
      sortedPop.forEach((year, index) => {
        const weight = Math.exp(-lambda * index);
        popTotalWeight += weight;
        popWeightedSum += year.popularity! * weight;
      });
      weightedPopularity = popWeightedSum / popTotalWeight;
    }

    return {
      min: weightedMin / totalWeight,
      median: weightedMedian / totalWeight,
      max: weightedMax / totalWeight,
      popularity: weightedPopularity
    };
  }, [course.years]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header row: name, code, CST link */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-xl">{course.name}</h2>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
            {course.code}
          </span>
          {latestYearData && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
            >
              <Link href={latestYearData.url} target="_blank">
                <ExternalLink className="h-3 w-3" />
                CST
              </Link>
            </Button>
          )}
        </div>
        {/* Lecturers inline */}
        {course.lecturers.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {course.lecturers.map((lecturer) => {
              const isCurrent =
                isCourseCurrentlyTaught &&
                globalCurrentYear !== null &&
                lecturer.years.includes(globalCurrentYear);
              return (
                <Link
                  key={lecturer.id}
                  href={`/profile/${lecturer.crsid}`}
                  className={cn(
                    "text-xs transition-colors hover:underline",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {lecturer.name ?? lecturer.crsid}
                  <span className="ml-1 text-[10px] text-muted-foreground/60">
                    {formatYearRanges(
                      lecturer.years,
                      isCourseCurrentlyTaught ? globalCurrentYear : null
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        {/* Overall stats — prominent, left-aligned */}
        {weightedOverallStats && (
          <div className="flex items-center gap-4 pt-1">
            <StatValue label="Min" value={weightedOverallStats.min} colored />
            <StatValue
              label="Med"
              value={weightedOverallStats.median}
              colored
            />
            <StatValue label="Max" value={weightedOverallStats.max} colored />
            {weightedOverallStats.popularity !== null && (
              <StatValue
                label="Pop"
                value={weightedOverallStats.popularity}
                suffix="%"
              />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Exponentially weighted average (decay: 0.3/year)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* All content cards flex-wrap together */}
      <div className="flex flex-wrap items-start gap-4">
        <UnifiedYearTable years={course.years} />
        <CourseQuestionsList courseId={courseId} years={course.years} />
        <CourseInsights courseId={courseId} />
      </div>

      {/* Discussion */}
      <div className="mt-2">
        <CommentThread courseId={courseId} />
      </div>
    </div>
  );
};

const StatValue = ({
  label,
  value,
  colored,
  suffix
}: {
  label: string;
  value: number;
  colored?: boolean;
  suffix?: string;
}) => (
  <div className="flex items-baseline gap-1">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span
      className="font-medium font-mono text-base"
      style={colored ? markTextColorStyle(value) : undefined}
    >
      {value.toFixed(1)}
      {suffix ?? ""}
    </span>
  </div>
);

function formatYearRanges(years: number[], currentYear: number | null): string {
  if (years.length === 0) return "";

  const sorted = [...years].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const year = sorted[i];
    if (year === rangeEnd + 1) {
      rangeEnd = year;
    } else {
      if (rangeStart === rangeEnd) {
        ranges.push(
          rangeEnd === currentYear ? "Current" : rangeStart.toString()
        );
      } else if (rangeEnd === currentYear) {
        ranges.push(`${rangeStart}-Current`);
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart = year;
      rangeEnd = year;
    }
  }

  return ranges.join(", ");
}

const getMarkStyle = markTextColorStyle;

// --- Unified year table: marks + course info in one card ---

const UnifiedYearTable = ({
  years
}: {
  years: {
    year: number;
    michaelmas: boolean;
    lent: boolean;
    easter: boolean;
    lectures: number | null;
    suggestedSupervisions: number | null;
    marksStats: {
      minMark: number;
      maxMark: number;
      avgMinMark: number;
      avgMaxMark: number;
      avgMedianMark: number;
    } | null;
    popularity: number | null;
  }[];
}) => {
  const displayYears = years.slice(0, 20);

  if (displayYears.length === 0) return null;

  return (
    <Card className="w-fit">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Year-by-Year</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex gap-1">
          {/* Row labels */}
          <div className="flex flex-col gap-1 pt-[44px]">
            <RowLabel>Min</RowLabel>
            <RowLabel>Med</RowLabel>
            <RowLabel>Max</RowLabel>
            <RowLabel>Pop%</RowLabel>
            <div className="h-1" />
            <RowLabel>M</RowLabel>
            <RowLabel>L</RowLabel>
            <RowLabel>E</RowLabel>
            <RowLabel>Lecs</RowLabel>
            <RowLabel>Supos</RowLabel>
          </div>

          {/* Year columns */}
          <div className="flex gap-1">
            {displayYears.map((year) => (
              <div key={year.year} className="flex flex-col items-center gap-1">
                <div className="relative h-10 w-6">
                  <span className="absolute top-3 -left-1 -rotate-90 text-foreground text-xs">
                    {year.year}
                  </span>
                </div>
                {/* Marks */}
                <MarkCell value={year.marksStats?.avgMinMark} />
                <MarkCell value={year.marksStats?.avgMedianMark} />
                <MarkCell value={year.marksStats?.avgMaxMark} />
                <div className="flex h-5 w-6 items-center justify-center">
                  {year.popularity !== null ? (
                    <span className="font-mono text-[10px] text-foreground">
                      {year.popularity.toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      -
                    </span>
                  )}
                </div>
                {/* Spacer */}
                <div className="h-1" />
                {/* Terms */}
                <TermDot active={year.michaelmas} />
                <TermDot active={year.lent} />
                <TermDot active={year.easter} />
                {/* Lectures */}
                <div className="flex h-5 w-6 items-center justify-center font-mono text-[10px]">
                  {year.lectures ?? "-"}
                </div>
                {/* Supervisions */}
                <div className="flex h-5 w-6 items-center justify-center font-mono text-[10px]">
                  {year.suggestedSupervisions ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RowLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-5 w-10 items-center text-muted-foreground text-xs">
    {children}
  </span>
);

const MarkCell = ({ value }: { value?: number }) => (
  <div className="flex h-5 w-6 items-center justify-center">
    {value != null ? (
      <span className="font-mono text-[10px]" style={getMarkStyle(value)}>
        {value.toFixed(0)}
      </span>
    ) : (
      <span className="font-mono text-[10px] text-muted-foreground">-</span>
    )}
  </div>
);

const TermDot = ({ active }: { active: boolean }) => (
  <div
    className={cn("h-5 w-5 rounded-sm", active ? "bg-primary" : "bg-muted")}
  />
);

// --- Questions list with topic filtering and search ---

const CourseQuestionsList = ({
  courseId,
  years
}: {
  courseId: number;
  years: {
    year: number;
    questions: {
      id: number;
      questionNumber: number;
      paperName: string;
      year: number;
      minimumMark: number | null;
      maximumMark: number | null;
      medianMark: number | null;
      attempts: number | null;
      userAnswers: number;
      bestMark?: number;
    }[];
  }[];
}) => {
  const searchParams = useSearchParams();
  const { data: topics } = trpc.course.getTopics.useQuery({ courseId });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(() => {
    const topicParam = searchParams.get("topic");
    return topicParam ? new Set([topicParam]) : new Set();
  });

  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setSelectedTopics(new Set([topicParam]));
    }
  }, [searchParams]);

  const allQuestions = useMemo(() => {
    const questions: {
      id: number;
      year: number;
      paperName: string;
      questionNumber: number;
      minimumMark: number | null;
      medianMark: number | null;
      maximumMark: number | null;
      userAnswers: number;
      bestMark?: number;
    }[] = [];

    for (const yearData of years) {
      for (const q of yearData.questions) {
        questions.push({
          id: q.id,
          year: q.year,
          paperName: q.paperName,
          questionNumber: q.questionNumber,
          minimumMark: q.minimumMark,
          medianMark: q.medianMark,
          maximumMark: q.maximumMark,
          userAnswers: q.userAnswers,
          bestMark: q.bestMark
        });
      }
    }

    return questions.sort(
      (a, b) =>
        b.year - a.year ||
        a.paperName.localeCompare(b.paperName) ||
        a.questionNumber - b.questionNumber
    );
  }, [years]);

  const filteredQuestions = useMemo(() => {
    let results = allQuestions;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (question) =>
          `p${question.paperName}q${question.questionNumber}`.includes(q) ||
          `${question.year}`.includes(q) ||
          `paper ${question.paperName}`.includes(q)
      );
    }

    return results;
  }, [allQuestions, searchQuery]);

  const toggleTopic = (slug: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <Card className="w-fit max-w-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Questions ({allQuestions.length})
          </CardTitle>
          <div className="relative w-48">
            <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter (e.g. p8q2, 2023)"
              className="h-7 pl-7 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Topic filter chips */}
        {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.slug)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                  selectedTopics.has(topic.slug)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {topic.name}
                <span className="ml-1 opacity-60">{topic.questionCount}</span>
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <QuestionRows
          questions={filteredQuestions}
          selectedTopics={selectedTopics}
        />
      </CardContent>
    </Card>
  );
};

const QuestionRows = ({
  questions,
  selectedTopics
}: {
  questions: {
    id: number;
    year: number;
    paperName: string;
    questionNumber: number;
    minimumMark: number | null;
    medianMark: number | null;
    maximumMark: number | null;
    userAnswers: number;
    bestMark?: number;
  }[];
  selectedTopics: Set<string>;
}) => {
  const { data: topicAssignments } = trpc.course.getQuestionTopics.useQuery(
    { questionIds: questions.map((q) => q.id) },
    { enabled: questions.length > 0 }
  );

  const filteredByTopics = useMemo(() => {
    if (selectedTopics.size === 0) return questions;
    if (!topicAssignments) return questions;

    return questions.filter((q) => {
      const qTopics = topicAssignments[q.id];
      if (!qTopics) return false;
      return qTopics.some((t) => selectedTopics.has(t.slug));
    });
  }, [questions, selectedTopics, topicAssignments]);

  if (filteredByTopics.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-xs">
        No questions match filters.
      </p>
    );
  }

  return (
    <div className="flex max-h-[500px] flex-col gap-0.5 overflow-y-auto">
      {filteredByTopics.map((q) => {
        const qTopics = topicAssignments?.[q.id];
        return (
          <Link
            key={q.id}
            href={`/p/${q.paperName}/${q.year}/${q.questionNumber}`}
            prefetch={false}
            className="flex items-center gap-2 rounded px-2 py-1 text-xs transition-colors hover:bg-muted"
          >
            <span className="w-10 shrink-0 font-mono text-muted-foreground">
              {q.year}
            </span>
            <span className="w-14 shrink-0 font-medium">
              P{q.paperName}Q{q.questionNumber}
            </span>
            {/* Min / Med / Max marks */}
            <div className="flex w-24 shrink-0 gap-1 font-mono text-[11px]">
              {q.minimumMark !== null ? (
                <span style={getMarkStyle(q.minimumMark)}>{q.minimumMark}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
              <span className="text-muted-foreground">/</span>
              {q.medianMark !== null ? (
                <span style={getMarkStyle(q.medianMark)}>{q.medianMark}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
              <span className="text-muted-foreground">/</span>
              {q.maximumMark !== null ? (
                <span style={getMarkStyle(q.maximumMark)}>{q.maximumMark}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            {/* User's best mark */}
            <span className="w-8 shrink-0 font-mono text-[11px]">
              {q.bestMark !== undefined ? (
                <span style={getMarkStyle(q.bestMark)}>{q.bestMark}/20</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
            {/* Topic badges */}
            {qTopics && qTopics.length > 0 && (
              <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
                {qTopics.slice(0, 2).map((t) => (
                  <span
                    key={t.slug}
                    className="truncate rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

// --- Examiner Insights ---

const CourseInsights = ({ courseId }: { courseId: number }) => {
  const { data: insight } = trpc.course.getInsight.useQuery({ courseId });

  if (!insight) return null;

  return (
    <Card className="relative max-h-[500px] max-w-lg overflow-hidden">
      <CardHeader className="relative z-10 bg-card pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4" />
          Examiner Insights
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Generated from {insight.yearsAnalyzed} years of examiner reports
        </p>
      </CardHeader>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-card to-transparent" />
        <CardContent className="max-h-[400px] overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:font-semibold [&_h2]:text-xs [&_li]:my-0.5 [&_ul]:my-1">
            <Markdown>{insight.content}</Markdown>
          </div>
        </CardContent>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-card to-transparent" />
      </div>
    </Card>
  );
};
