"use client";

import type { inferRouterOutputs } from "@trpc/server";
import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  MessageSquare,
  PenTool,
  Star
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import { CommentContent } from "../comment/comment-content";
import { ErrorMessage } from "../error";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export const ProfileContentClient = ({ crsid }: { crsid: string }) => {
  return (
    <ErrorBoundary
      fallback={
        <ErrorMessage
          title="Failed to load profile"
          description="Could not load user profile."
        />
      }
    >
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileInner crsid={crsid} />
      </Suspense>
    </ErrorBoundary>
  );
};

const ProfileSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex gap-4">
      <Skeleton className="h-20 w-20 rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-20 w-36" />
      <Skeleton className="h-20 w-36" />
      <Skeleton className="h-20 w-36" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

const ProfileInner = ({ crsid }: { crsid: string }) => {
  const [profile] = trpc.user.getProfile.useSuspenseQuery({ crsid });

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <TopSection profile={profile} crsid={crsid} />
      <StatsRow profile={profile} />

      {profile.isLecturer && (
        <>
          <CoursesLectured courses={profile.coursesLectured} />
          {profile.questionsAuthored.length > 0 && (
            <QuestionsAuthored questions={profile.questionsAuthored} />
          )}
        </>
      )}

      <ActivitySection profile={profile} />
    </div>
  );
};

type Profile = inferRouterOutputs<AppRouter>["user"]["getProfile"];

const TopSection = ({
  profile,
  crsid
}: {
  profile: Profile;
  crsid: string;
}) => (
  <div className="flex items-start gap-4">
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
      {profile.clerkUser?.imageUrl ? (
        <Image
          src={profile.clerkUser.imageUrl}
          alt={crsid}
          fill
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <span className="text-lg text-muted-foreground">
            {crsid.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
    </div>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-xl">
          {profile.clerkUser
            ? `${profile.clerkUser.firstName} ${profile.clerkUser.lastName}`
            : (profile.name ?? crsid)}
        </h2>
      </div>
      <span className="font-mono text-muted-foreground text-sm">{crsid}</span>
      <div className="flex items-center gap-1.5">
        {profile.isLecturer && (
          <Badge variant="secondary" className="gap-1">
            <GraduationCap className="h-3 w-3" />
            Lecturer
          </Badge>
        )}
        {profile.admin && (
          <Badge variant="default" className="gap-1">
            Admin
          </Badge>
        )}
        {profile.karma !== 0 && (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <Star className="h-3 w-3" />
            {profile.karma} karma
          </span>
        )}
        {profile.isLecturer && (
          <Link
            href={`https://www.cst.cam.ac.uk/people/${crsid}`}
            target="_blank"
            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground hover:underline"
          >
            CST Page
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  </div>
);

const StatsRow = ({ profile }: { profile: Profile }) => (
  <div className="flex flex-wrap gap-3">
    <Card className="min-w-[8rem]">
      <CardContent className="flex flex-col items-center gap-1 py-3">
        <PenTool className="h-4 w-4 text-muted-foreground" />
        <span className="font-bold text-xl">{profile.totalAnswers}</span>
        <span className="text-muted-foreground text-xs">
          Questions Answered
        </span>
      </CardContent>
    </Card>
    <Card className="min-w-[8rem]">
      <CardContent className="flex flex-col items-center gap-1 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="font-bold text-xl">{profile.totalComments}</span>
        <span className="text-muted-foreground text-xs">Comments</span>
      </CardContent>
    </Card>
    {profile.isLecturer && (
      <Card className="min-w-[8rem]">
        <CardContent className="flex flex-col items-center gap-1 py-3">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold text-xl">
            {profile.coursesLectured.length}
          </span>
          <span className="text-muted-foreground text-xs">
            Courses Lectured
          </span>
        </CardContent>
      </Card>
    )}
  </div>
);

const CoursesLectured = ({
  courses
}: {
  courses: Profile["coursesLectured"];
}) => {
  if (courses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4" />
          Courses Lectured
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 transition-colors hover:bg-muted"
            >
              <div>
                <span className="font-medium text-sm">{course.name}</span>
                <span className="ml-2 font-mono text-muted-foreground text-xs">
                  {course.code}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                {formatYearRange(course.years)}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const QuestionsAuthored = ({
  questions
}: {
  questions: Profile["questionsAuthored"];
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm">
        <PenTool className="h-4 w-4" />
        Questions Authored ({questions.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <Link
            key={q.questionId}
            href={`/p/${q.paperName}/${q.year}/${q.questionNumber}`}
            className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted"
          >
            <span className="font-medium">
              {q.year} P{q.paperName} Q{q.questionNumber}
            </span>
            {q.courseName && (
              <span className="ml-1 text-muted-foreground">{q.courseName}</span>
            )}
          </Link>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ActivitySection = ({ profile }: { profile: Profile }) => (
  <div>
    <Separator className="mb-4" />
    <Tabs defaultValue="comments">
      <TabsList>
        <TabsTrigger value="comments" className="text-xs">
          Comments ({profile.recentComments.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="comments">
        {profile.recentComments.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No comments yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {profile.recentComments.map((comment) => (
              <div
                key={comment.id}
                className="flex flex-col gap-1 rounded-md border p-3"
              >
                <div className="flex items-center gap-2 text-xs">
                  {comment.questionId && comment.paperName && comment.paperYear && comment.questionNumber ? (
                    <Link
                      href={`/p/${comment.paperName}/${comment.paperYear}/${comment.questionNumber}`}
                      className="text-primary hover:underline"
                    >
                      {comment.paperYear} P{comment.paperName} Q{comment.questionNumber}
                    </Link>
                  ) : comment.courseId && comment.courseName ? (
                    <Link
                      href={`/course/${comment.courseId}`}
                      className="text-primary hover:underline"
                    >
                      {comment.courseName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">comment</span>
                  )}
                  <span className="text-muted-foreground">
                    {comment.createdAt.toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">
                    +{comment.score}
                  </span>
                </div>
                <div className="line-clamp-3 text-xs">
                  <CommentContent content={comment.content} />
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  </div>
);

function formatYearRange(years: number[]): string {
  if (years.length === 0) return "";
  if (years.length === 1) return years[0].toString();
  const sorted = [...years].sort((a, b) => a - b);
  return `${sorted[0]}-${sorted[sorted.length - 1]}`;
}
