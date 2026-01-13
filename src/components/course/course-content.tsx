"use client";

import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { ErrorMessage } from "../error";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";

// Main content wrapper
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

const CourseContentSkeleton = () => {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
};

const CourseContentInner = ({ courseId }: { courseId: number }) => {
  const [course] = trpc.course.getCourse.useSuspenseQuery({ courseId });

  // Use globalCurrentYear from the database (max year across all tripos parts)
  const globalCurrentYear = course.globalCurrentYear;

  // Check if this course is currently being taught
  const isCourseCurrentlyTaught = useMemo(() => {
    return (
      globalCurrentYear !== null &&
      course.years.some((y) => y.year === globalCurrentYear)
    );
  }, [course.years, globalCurrentYear]);

  const latestYearData = useMemo(() => {
    return course.years.length > 0 ? course.years[0] : null;
  }, [course.years]);

  // Calculate exponentially weighted overall stats (last 5 years weighted more heavily)
  const weightedOverallStats = useMemo(() => {
    const yearsWithStats = course.years.filter((y) => y.marksStats !== null);
    if (yearsWithStats.length === 0) return null;

    // Sort by year descending
    const sorted = [...yearsWithStats].sort((a, b) => b.year - a.year);

    // Exponential decay: weight = e^(-lambda * yearsAgo), lambda = 0.3
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

    // Calculate weighted popularity separately (only for years with popularity data)
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
    <div className="flex flex-col gap-6">
      {/* Header with course name and external link */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-2xl">{course.name}</h2>
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-muted-foreground text-sm">
            {course.code}
          </span>
        </div>
        {latestYearData && (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href={latestYearData.url} target="_blank">
              CST Course Page
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      {/* Lecturers - no card, inline display */}
      {course.lecturers.length > 0 && (
        <LecturersDisplay
          lecturers={course.lecturers}
          globalCurrentYear={globalCurrentYear}
          isCourseCurrentlyTaught={isCourseCurrentlyTaught}
        />
      )}

      {/* Overall Stats Card */}
      {weightedOverallStats && (
        <OverallStatsCard stats={weightedOverallStats} />
      )}

      {/* Flex row for history and marks */}
      <div className="flex flex-wrap gap-4">
        {/* Course History Stats */}
        <CourseHistoryStats years={course.years} />

        {/* Marks Statistics Table */}
        <CourseMarksTable years={course.years} />
      </div>

      {/* Questions Grid */}
      <CourseQuestionsGrid years={course.years} />
    </div>
  );
};

// Helper to format year ranges like "2012-2014, 2016, 2019-Current"
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
      // Close current range
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

// Lecturers display - no card, highlights current
const LecturersDisplay = ({
  lecturers,
  globalCurrentYear,
  isCourseCurrentlyTaught
}: {
  lecturers: {
    id: number;
    name: string | null;
    crsid: string | null;
    years: number[];
  }[];
  globalCurrentYear: number | null;
  isCourseCurrentlyTaught: boolean;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium text-muted-foreground text-sm">Lecturers</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {lecturers.map((lecturer) => {
          // A lecturer is "current" only if the course is currently taught AND they teach in the current year
          const isCurrent =
            isCourseCurrentlyTaught &&
            globalCurrentYear !== null &&
            lecturer.years.includes(globalCurrentYear);
          return (
            <Link
              key={lecturer.id}
              href={`/profile/${lecturer.crsid}`}
              className={cn(
                "text-sm transition-colors hover:underline",
                isCurrent
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {lecturer.name ?? lecturer.crsid}
              <span className="ml-1 text-muted-foreground/70 text-xs">
                {formatYearRanges(
                  lecturer.years,
                  isCourseCurrentlyTaught ? globalCurrentYear : null
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Overall stats card with exponential decay explanation
const OverallStatsCard = ({
  stats
}: {
  stats: {
    min: number;
    median: number;
    max: number;
    popularity: number | null;
  };
}) => {
  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          Overall Statistics
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Weighted average using exponential decay. Recent years are
                  weighted more heavily than older years (decay factor: 0.3 per
                  year).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">Min</span>
            <span className={cn("font-mono text-lg", getMarkColor(stats.min))}>
              {stats.min.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">Median</span>
            <span
              className={cn("font-mono text-lg", getMarkColor(stats.median))}
            >
              {stats.median.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">Max</span>
            <span className={cn("font-mono text-lg", getMarkColor(stats.max))}>
              {stats.max.toFixed(1)}
            </span>
          </div>
          {stats.popularity !== null && (
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">Popularity</span>
              <span className="font-mono text-foreground text-lg">
                {stats.popularity.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getMarkColor(value: number): string {
  if (value >= 15) return "text-green-600 dark:text-green-400";
  if (value >= 10) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

// Course history - horizontal years, vertical terms
const CourseHistoryStats = ({
  years
}: {
  years: {
    year: number;
    michaelmas: boolean;
    lent: boolean;
    easter: boolean;
    lectures: number | null;
    suggestedSupervisions: number | null;
  }[];
}) => {
  if (years.length === 0) return null;

  const displayYears = years.slice(0, 15);

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Course History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Row labels */}
          <div className="flex flex-col gap-1 pt-[44px]">
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              M
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              L
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              E
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              Lecs
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              Supos
            </span>
          </div>

          {/* Year columns */}
          <div className="flex gap-1">
            {displayYears.map((year) => (
              <div key={year.year} className="flex flex-col items-center gap-1">
                {/* Year label rotated */}
                <div className="relative h-10 w-5">
                  <span className="absolute top-3 -left-1.5 -rotate-90 text-foreground text-sm">
                    {year.year}
                  </span>
                </div>
                {/* Terms stacked vertically */}
                <TermDot active={year.michaelmas} />
                <TermDot active={year.lent} />
                <TermDot active={year.easter} />
                {/* Lectures */}
                <div className="flex h-5 w-5 items-center justify-center font-mono text-xs">
                  {year.lectures ?? "-"}
                </div>
                {/* Supervisions */}
                <div className="flex h-5 w-5 items-center justify-center font-mono text-xs">
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

const TermDot = ({ active }: { active: boolean }) => {
  return (
    <div
      className={cn("h-5 w-5 rounded-md", active ? "bg-primary" : "bg-muted")}
    />
  );
};

// Marks statistics table - horizontal years
const CourseMarksTable = ({
  years
}: {
  years: {
    year: number;
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
  const yearsWithStats = years
    .filter((y) => y.marksStats !== null || y.popularity !== null)
    .slice(0, 15);

  if (yearsWithStats.length === 0) return null;

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mark Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Row labels */}
          <div className="flex flex-col gap-1 pt-[44px]">
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              Min
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              Med
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              Max
            </span>
            <span className="flex h-5 items-center text-muted-foreground text-xs">
              Pop%
            </span>
          </div>

          {/* Year columns */}
          <div className="flex gap-1">
            {yearsWithStats.map((year) => (
              <div key={year.year} className="flex flex-col items-center gap-1">
                {/* Year label rotated */}
                <div className="relative h-10 w-6">
                  <span className="absolute top-3 -left-1 -rotate-90 text-foreground text-sm">
                    {year.year}
                  </span>
                </div>
                {/* Min */}
                <div className="flex h-5 w-6 items-center justify-center">
                  {year.marksStats ? (
                    <span
                      className={cn(
                        "font-mono text-xs",
                        getMarkColor(year.marksStats.avgMinMark)
                      )}
                    >
                      {year.marksStats.avgMinMark.toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground text-xs">
                      -
                    </span>
                  )}
                </div>
                {/* Median */}
                <div className="flex h-5 w-6 items-center justify-center">
                  {year.marksStats ? (
                    <span
                      className={cn(
                        "font-mono text-xs",
                        getMarkColor(year.marksStats.avgMedianMark)
                      )}
                    >
                      {year.marksStats.avgMedianMark.toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground text-xs">
                      -
                    </span>
                  )}
                </div>
                {/* Max */}
                <div className="flex h-5 w-6 items-center justify-center">
                  {year.marksStats ? (
                    <span
                      className={cn(
                        "font-mono text-xs",
                        getMarkColor(year.marksStats.avgMaxMark)
                      )}
                    >
                      {year.marksStats.avgMaxMark.toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground text-xs">
                      -
                    </span>
                  )}
                </div>
                {/* Popularity */}
                <div className="flex h-5 w-6 items-center justify-center">
                  {year.popularity !== null ? (
                    <span className="font-mono text-foreground text-xs">
                      {year.popularity.toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground text-xs">
                      -
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Questions grid showing all questions for the course
const CourseQuestionsGrid = ({
  years
}: {
  years: {
    year: number;
    questions: {
      id: number;
      questionNumber: number;
      paperName: string;
      year: number;
      userAnswers: number;
    }[];
  }[];
}) => {
  // Build a map of all unique paper+question combinations
  const sortedQuestions = useMemo(() => {
    const questionSet = new Map<
      string,
      { paperName: string; questionNumber: number }
    >();

    for (const year of years) {
      for (const q of year.questions) {
        const key = `${q.paperName}-${q.questionNumber}`;
        if (!questionSet.has(key)) {
          questionSet.set(key, {
            paperName: q.paperName,
            questionNumber: q.questionNumber
          });
        }
      }
    }

    return Array.from(questionSet.values()).sort(
      (a, b) =>
        a.paperName.localeCompare(b.paperName) ||
        a.questionNumber - b.questionNumber
    );
  }, [years]);

  // Build a lookup for quick access
  const questionMap = useMemo(() => {
    const map: Record<number, Record<string, number>> = {};
    for (const year of years) {
      map[year.year] = {};
      for (const q of year.questions) {
        map[year.year][`${q.paperName}-${q.questionNumber}`] = q.userAnswers;
      }
    }
    return map;
  }, [years]);

  if (years.length === 0 || sortedQuestions.length === 0) return null;

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Question number labels column */}
          <div className="flex flex-col gap-1 pt-[44px]">
            {sortedQuestions.map((q) => (
              <span
                key={`${q.paperName}-${q.questionNumber}`}
                className="flex h-5 w-10 items-center justify-end text-sm"
              >
                <span className="text-muted-foreground">p</span>
                {q.paperName}
                <span className="text-muted-foreground">q</span>
                {q.questionNumber}
              </span>
            ))}
          </div>

          {/* Year columns */}
          <div className="flex gap-1">
            {years.map((year) => (
              <div key={year.year} className="flex flex-col gap-1">
                <div className="relative h-10 w-5">
                  <span className="absolute top-3 -left-1.5 -rotate-90 text-foreground text-sm">
                    {year.year}
                  </span>
                </div>
                {sortedQuestions.map((q) => {
                  const key = `${q.paperName}-${q.questionNumber}`;
                  const userAnswers = questionMap[year.year]?.[key];

                  if (typeof userAnswers !== "number") {
                    return <div key={key} className="h-5 w-5" />;
                  }

                  return (
                    <Link
                      key={key}
                      href={`/p/${q.paperName}/${year.year}/${q.questionNumber}`}
                      prefetch={false}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded-md transition-colors",
                          userAnswers > 0
                            ? "bg-green-700"
                            : "bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
