import { getQuestionByPaperYearNumber } from "@/queries/question";
import { redirect } from "next/navigation";

interface ExternalUrlParams {
  url?: string[];
}

export default async function ExternalUrlRedirect({
  params,
}: {
  params: ExternalUrlParams;
}) {
  if (!params.url || params.url.length === 0) {
    redirect("/");
  }

  // Join the URL segments back together
  const fullUrl = params.url.join("/");

  // Example URL: www.cl.cam.ac.uk/teaching/exams/pastpapers/y2002p4q2.pdf
  const match = fullUrl.match(/y(\d{4})p(\d+)q(\d+)/i);

  if (!match) {
    redirect("/");
  }

  const [_, year, part, questionNumber] = match;

  console.log(year, part, questionNumber);

  const question = await getQuestionByPaperYearNumber({
    paper: part,
    year,
    questionNumber,
  });

  if (!question) {
    redirect("/");
  }

  const questionUrl = `/${question.courseYear.TriposPartYear?.triposPart.tripos.code ?? 'CST'}` +
  `/${question.courseYear.TriposPartYear?.triposPart.name ?? 'null'}` +
  `/${question.courseYear.course.code}` +
  `/${question.courseYear.year}` +
  `/${question.questionNumber}`;

  // Redirect to the appropriate internal URL format
  redirect(questionUrl);
} 