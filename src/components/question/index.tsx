import { HydrateClient } from "@/trpc/server";
import { Separator } from "../ui/separator";
import { SplitQuestionLayout } from "./panel-layout";
import { QuestionCourseCard } from "./question-course-card";
import PdfViewer from "./question-renderer";
import {
  ActionBar,
  Attempts,
  ExaminerComments,
  QuestionStatistics,
  Title
} from "./right-panel-client";

export const Question = async ({
  paperNumber,
  year,
  questionNumber
}: { paperNumber: string; year: string; questionNumber: string }) => {
  return (
    <SplitQuestionLayout
      left={
        <HydrateClient>
          <PdfViewer
            paperNumber={paperNumber}
            year={year}
            questionNumber={questionNumber}
          />
        </HydrateClient>
      }
      right={
        <RightPanel
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      }
    />
  );
};

export const RightPanel = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  return (
    <div className="flex h-full w-full flex-col rounded-xl p-2">
      <div className="mb-3 flex justify-center">
        <HydrateClient>
          <Title
            paperNumber={paperNumber}
            year={year}
            questionNumber={questionNumber}
          />
        </HydrateClient>
      </div>
      <HydrateClient>
        <ActionBar
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <div className="my-2" />

      <HydrateClient>
        <QuestionStatistics
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <div className="my-2" />

      <HydrateClient>
        <ExaminerComments
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <Separator className="my-4" />

      <HydrateClient>
        <Attempts
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <Separator className="my-4" />

      <HydrateClient>
        <QuestionCourseCard
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <div className="w-full pt-12 pb-24 text-center text-muted-foreground text-sm">
        Discussion coming soon!
      </div>
    </div>
  );
};
