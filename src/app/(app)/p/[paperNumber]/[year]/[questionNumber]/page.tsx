import { PageLayout } from "@/components/layout/page-layout";
import { Question } from "@/components/question";
import { withParamsCache } from "@/lib/with-params-cache";
import { trpc } from "@/trpc/server";

async function QuestionPage({
  params
}: {
  params: Promise<{
    paperNumber: string;
    year: string;
    questionNumber: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { paperNumber, year, questionNumber } = await params;
  trpc.question.getQuestion.prefetch({
    paperNumber,
    year,
    questionNumber
  });

  return (
    <PageLayout
      header={
        <h1>
          {year} Paper {paperNumber} Question {questionNumber}
        </h1>
      }
    >
      <Question
        paperNumber={paperNumber}
        year={year}
        questionNumber={questionNumber}
      />
    </PageLayout>
  );
}

export default withParamsCache(QuestionPage);
