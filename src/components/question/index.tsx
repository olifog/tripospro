import { HydrateClient } from "@/trpc/server";
import { SplitQuestionLayout } from "./panel-layout";
import PdfViewer from "./question-renderer";

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

const RightPanel = ({
  paperNumber,
  year,
  questionNumber
}: { paperNumber: string; year: string; questionNumber: string }) => {
  return (
    <div>
      <h1>Right Panel</h1>
    </div>
  );
};
