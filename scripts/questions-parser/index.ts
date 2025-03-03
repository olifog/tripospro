import { z } from "zod";

export const QuestionSchema = z.object({
  year: z.string(),
  paper: z.string(),
  question: z.string(),
  author: z.string().optional(),
  topic: z.string(),
  pdf: z.string().optional(),
  solutions: z.string().optional()
});

export const QuestionsSchema = z.array(QuestionSchema);

interface ParseOptions {
  content: string;
}

export function parseQuestions({
  content
}: ParseOptions): z.infer<typeof QuestionsSchema> {
  // content is a csv of form:
  //   year	paper	question	author	topic	pdf	solutions
  // 2024	1	1	avsm2	Foundations of Computer Science	y2024p1q1.pdf	https://www.cl.cam.ac.uk/teaching/exams/solutions/2024/2024-p01-q01-solutions.pdf
  // 2024	1	2	avsm2	Foundations of Computer Science	y2024p1q2.pdf	https://www.cl.cam.ac.uk/teaching/exams/solutions/2024/2024-p01-q02-solutions.pdf
  // 2024	1	3	rkh23	Object-Oriented Programming	y2024p1q3.pdf	https://www.cl.cam.ac.uk/teaching/exams/solutions/2024/2024-p01-q03-solutions.pdf
  // 2024	1	4	rkh23	Object-Oriented Programming	y2024p1q4.pdf	https://www.cl.cam.ac.uk/teaching/exams/solutions/2024/2024-p01-q04-solutions.pdf
  // 2024 2 1 abc12 Economics, Law and Ethics y2024p2q1.pdf https://www.cl.cam.ac.uk/teaching/exams/solutions/2024/2024-p02-q01-solutions.pdf

  const lines = content.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1, -1).map((line) => {
    const values = line.split(",");

    // the 5th value, topic, could have commas inside it -- need to keep merging values until there's only 7 values left
    let topic = values[4];
    while (values.length > 7) {
      topic += `,${values[5]}`;
      values.splice(5, 1);
    }

    values[4] = topic.replace(/^"|"$/g, "");

    return headers.reduce(
      (acc, header, index) => {
        acc[header] = values[index]?.trim();
        return acc;
      },
      {} as Record<string, string>
    );
  });

  return QuestionsSchema.parse(rows);
}
