import { HydrateClient } from "@/trpc/server";
import { SplitQuestionLayout } from "./panel-layout";
import PdfViewer from "./question-renderer";
import { RightPanelTabs } from "./right-panel-tabs";

export { LockInProvider } from "./lock-in-context";

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
        <HydrateClient>
          <RightPanelTabs
            paperNumber={paperNumber}
            year={year}
            questionNumber={questionNumber}
          />
        </HydrateClient>
      }
    />
  );
};
