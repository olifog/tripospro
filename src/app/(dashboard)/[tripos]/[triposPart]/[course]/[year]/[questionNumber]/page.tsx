import { createAnswer } from "@/actions/question";
import { MarkDoneButton } from "@/components/MarkDoneButton";
import PdfViewer from "@/components/PdfViewer";
import { QuestionPage } from "@/components/QuestionPage";
import { Button } from "@/components/ui/button";

import { getQuestionAnswers, getQuestionByPath } from "@/queries/question";
import { getCurrentUser } from "@/queries/user";
import { notFound } from "next/navigation";

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

  if (!question) return notFound();

  const user = await getCurrentUser();

  const answers = user
    ? await getQuestionAnswers({ questionId: question.id, userId: user.id })
    : undefined;

  return <QuestionPage user={user} question={question} answers={answers} />;
}
