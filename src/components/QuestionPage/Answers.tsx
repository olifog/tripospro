import { troute } from "@/troute";

export const Answers = ({
  questionId,
  userId,
}: {
  questionId: number;
  userId: string;
}) => {
  const { data: answers, isLoading } = troute.getQuestionAnswers({
    params: { questionId: questionId, userId: userId },
    enabled: !!userId,
  });

  if (isLoading) return null;

  const sortedAnswers = answers?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold mb-2">Previously Logged Answers</h3>
      {(!answers || answers.length === 0) && (
        <p className="text-sm text-slate-500">No logged answers yet</p>
      )}
      <div className="grid grid-cols-1 gap-2">
        {sortedAnswers &&
          sortedAnswers.map((answer) => (
            <div
              className="rounded-lg dark:bg-slate-900 bg-slate-800 border dark:border-slate-800 border-slate-700 p-1 w-60 shadow-md"
              key={answer.id}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-white font-semibold text-sm">
                  {new Date(answer.createdAt).toLocaleDateString()}
                </p>
                <span className="text-xs text-slate-400">
                  {new Date(answer.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Marks:{" "}
                  <span className="font-semibold text-slate-200 pl-1">
                    {answer.marks}
                  </span>
                  /10
                </span>
                <span className="text-xs text-slate-400">
                  Time Taken:{" "}
                  <span className="font-semibold text-slate-200 pl-1">
                    {answer.timeTaken}
                  </span>{" "}
                  mins
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
