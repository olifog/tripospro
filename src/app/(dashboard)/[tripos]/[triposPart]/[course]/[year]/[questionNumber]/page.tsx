import { createAnswer } from "@/actions/question";
import { MarkDoneButton } from "@/components/MarkDoneButton";
import PdfViewer from "@/components/PdfViewer";
import { Button } from "@/components/ui/button";

import { getQuestionByPath } from "@/queries/question";
import { getCurrentUser } from "@/queries/user";

export default async function Question({
  params,
}: {
  params: {
    tripos: string;
    triposPart: string;
    course: string;
    year: string;
    questionNumber: string;
  };
}) {
  const question = await getQuestionByPath({
    tripos: params.tripos,
    triposPart: params.triposPart,
    course: params.course,
    year: params.year,
    questionNumber: params.questionNumber,
  });

  const user = await getCurrentUser();

  return (
    <div className="w-full max-w-3xl h-[80vh] flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-12">
        <h1>
          {params.tripos} {params.triposPart} {params.course} {params.year}{" "}
          {params.questionNumber}
        </h1>
        <MarkDoneButton questionId={question?.id} userId={user?.id} />
      </div>
      <div className="relative w-full h-full">
        {question?.questionUrl && (
          <PdfViewer
            url={`https://www.cl.cam.ac.uk/teaching/exams/pastpapers/${question.questionUrl}`}
          />
        )}
      </div>
    </div>
  );
}
