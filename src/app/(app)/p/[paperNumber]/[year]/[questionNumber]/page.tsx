import { PageLayout } from "@/components/layout/page-layout";
import { Question, LockInProvider } from "@/components/question";
import { LockInExit } from "@/components/question/lock-in-exit";
import { withParamsCache } from "@/lib/with-params-cache";
import { trpc } from "@/trpc/server";

export async function generateMetadata({
  params
}: {
  params: Promise<{
    paperNumber: string;
    year: string;
    questionNumber: string;
  }>;
}) {
  const { paperNumber, year, questionNumber } = await params;

  return {
    title: `${year} P${paperNumber} Question ${questionNumber}`
  };
}

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
  trpc.question.getQuestionCourse.prefetch({
    paperNumber,
    year,
    questionNumber
  });
  trpc.question.getUserAnswers.prefetch(
    {
      paperNumber,
      year,
      questionNumber
    },
    {
      retry: false,
      retryDelay: 20000
    }
  );

  return (
    <LockInProvider>
      <PageLayout
        header={
          <>
            <h1>
              {year} Paper {paperNumber} Question {questionNumber}
            </h1>
            <LockInExit />
          </>
        }
      >
        <Question
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </PageLayout>
    </LockInProvider>
  );
}

export default withParamsCache(QuestionPage);
