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
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
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
    <div className="flex h-full w-full flex-col gap-3 rounded-lg p-2">
      <div className="flex justify-center">
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

      <HydrateClient>
        <QuestionStatistics
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <HydrateClient>
        <ExaminerComments
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <Separator />

      <HydrateClient>
        <Attempts
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>

      <Separator />

      <HydrateClient>
        <QuestionCourseCard
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </HydrateClient>
    </div>
  );
};
