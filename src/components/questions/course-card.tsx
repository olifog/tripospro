"use client";

import { useUser } from "@clerk/nextjs";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuestionsFilter } from "@/hooks/use-params";
import { scoreColor } from "@/lib/score-colors";
import { defaultQuestionsFilter } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Link } from "../link/client";

export type CourseCardData = {
  courseId: number;
  courseName: string;
  courseCode: string;
  years: {
    year: number;
    questions: {
      questionNumber: number;
      paperName: string;
      answers?: number;
      bestMark?: number;
      flagged?: boolean;
    }[];
  }[];
};

export type QuestionsFilter = {
  yearCutoff?: number;
  search?: string;
  onlyCurrent?: boolean;
  onlyStarred?: boolean;
  showQuestionNumbers?: boolean;
};

export const CourseCard = ({
  course,
  currentYear,
  overrideFilters,
  highlight,
  starredCourseIds
}: {
  course: CourseCardData;
  currentYear: number;
  overrideFilters?: QuestionsFilter;
  highlight?: { year: number; questionNumber: number; paperNumber: string };
  starredCourseIds?: Set<number>;
}) => {
  const [urlFilters] = useQuestionsFilter();
  const { isSignedIn } = useUser();

  const { search, yearCutoff, onlyCurrent, onlyStarred, showQuestionNumbers } =
    overrideFilters
      ? {
          search: "",
          yearCutoff: 1993,
          onlyCurrent: false,
          onlyStarred: false,
          showQuestionNumbers: true,
          ...overrideFilters
        }
      : urlFilters;

  const isStarred = starredCourseIds?.has(course.courseId) ?? false;

  const toggleStar = trpc.course.toggleStarCourse.useMutation();
  const utils = trpc.useUtils();

  const isCurrent = useMemo(() => {
    return course.years.some((year) => year.year === currentYear);
  }, [course.years, currentYear]);

  const matchesSearch = useMemo(() => {
    return course.courseName
      .toLowerCase()
      .includes(search?.toLowerCase() ?? "");
  }, [search, course.courseName]);

  const [sortedYears, sortedQuestions, questionMap] = useMemo(() => {
    const filteredYears = course.years.filter(
      (year) => year.year >= (yearCutoff ?? defaultQuestionsFilter.yearCutoff)
    );

    const sortedYears = filteredYears.sort((a, b) => b.year - a.year);

    const sortedQuestions = Object.values(
      sortedYears.reduce(
        (acc, year) => {
          for (const question of year.questions) {
            acc[`${question.paperName}-${question.questionNumber}`] = {
              questionNumber: question.questionNumber,
              paperName: question.paperName
            };
          }
          return acc;
        },
        {} as Record<string, { questionNumber: number; paperName: string }>
      )
    ).sort(
      (a, b) =>
        a.paperName.localeCompare(b.paperName) ||
        a.questionNumber - b.questionNumber
    );

    const questionMap: Record<
      number,
      | Record<
          string,
          { answers: number; bestMark?: number; flagged?: boolean } | undefined
        >
      | undefined
    > = {};
    for (const year of sortedYears) {
      questionMap[year.year] = {};
      for (const question of year.questions) {
        questionMap[year.year]![
          `${question.paperName}-${question.questionNumber}`
        ] = {
          answers: question.answers ?? 0,
          bestMark: question.bestMark,
          flagged: question.flagged
        };
      }
    }

    return [sortedYears, sortedQuestions, questionMap];
  }, [course, yearCutoff]);

  const isMobile = useIsMobile();
  const router = useRouter();
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDraggingRef.current = true;
      }
    }
  };

  const handleCourseClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      router.push(`/course/${course.courseId}`);
    }
    mouseDownPosRef.current = null;
    isDraggingRef.current = false;
  };

  if (search && !matchesSearch) return null;
  if (onlyCurrent && !isCurrent) return null;
  if (onlyStarred && !isStarred) return null;
  if (sortedYears.length === 0) return null;

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStar.mutate(
      { courseId: course.courseId },
      { onSuccess: () => utils.course.getStarredCourses.invalidate() }
    );
  };

  return (
    <div
      className={cn(
        "absolute m-1 flex w-fit min-w-32 flex-col rounded-md border bg-card px-2 py-1 text-card-foreground shadow-sm",
        isStarred && "border-warning/60"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onClick={handleCourseClick}
                className="w-fit cursor-pointer text-left font-semibold text-sm hover:underline"
              >
                {course.courseCode.length > 12
                  ? `${course.courseCode.slice(0, 12).trim()}…`
                  : course.courseCode}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{course.courseName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isSignedIn && (
          <button
            type="button"
            onClick={handleStarClick}
            className="shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-warning"
            aria-label={isStarred ? "Unstar course" : "Star course"}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                isStarred && "fill-warning text-warning"
              )}
            />
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {showQuestionNumbers && (
          <div className="flex flex-col gap-1 pt-[44px]">
            {sortedQuestions.map((question) => (
              <span
                key={`${question.paperName}-${question.questionNumber}`}
                className="flex h-5 w-10 items-center justify-end text-sm"
              >
                <span className="text-muted-foreground">p</span>
                {question.paperName}
                <span className="text-muted-foreground">q</span>
                {question.questionNumber}
              </span>
            ))}
          </div>
        )}
        <div
          className={cn("flex gap-1", isMobile && "max-w-96 overflow-x-auto")}
        >
          {sortedYears.map((year) => (
            <div key={year.year} className="flex flex-col gap-1">
              <div className="relative h-10 w-5">
                <span className="absolute top-3 -left-1.5 -rotate-90 text-foreground text-sm">
                  {year.year}
                </span>
              </div>
              {sortedQuestions.map((question) => {
                const entry =
                  questionMap[year.year]?.[
                    `${question.paperName}-${question.questionNumber}`
                  ];
                if (!entry)
                  return showQuestionNumbers ? (
                    <div
                      key={`${question.paperName}-${question.questionNumber}`}
                      className="h-5 w-5"
                    />
                  ) : null;

                const isHighlighted =
                  highlight?.year === year.year &&
                  highlight?.questionNumber === question.questionNumber &&
                  highlight?.paperNumber === question.paperName;

                return (
                  <Link
                    key={`${question.paperName}-${question.questionNumber}`}
                    href={`/p/${question.paperName}/${year.year}/${question.questionNumber}`}
                    prefetch={false}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-sm transition-colors",
                        isHighlighted
                          ? "bg-ring"
                          : entry.answers > 0
                            ? scoreColor(entry.bestMark)
                            : "bg-score-unattempted/30 hover:bg-score-unattempted/50",
                        entry.flagged && "ring-2 ring-warning"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
