import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { answerQuestion } from "@/actions/question";
import { useRouter } from "next/navigation";

export const RecordDone = ({
  refetch,
  questionId,
  userId,
}: {
  questionId: number;
  refetch: () => void;
  userId: string;
}) => {
  const [recordDoneOpen, setRecordDoneOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => setRecordDoneOpen(!recordDoneOpen)}>
        <h3 className="text-sm font-semibold flex items-center space-x-1">
          <span>Record Done</span>
          {recordDoneOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </h3>
      </button>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const timeTaken = (
            (e.target as HTMLFormElement)[0] as HTMLInputElement
          ).value;
          const marks = (
            (e.target as HTMLFormElement)[1] as HTMLInputElement
          ).value;

          if (!timeTaken || !marks) return;

          setIsLoading(true);

          await answerQuestion({
            questionId,
            userId,
            timeTaken: parseInt(timeTaken as string),
            marks: parseInt(marks as string),
          });

          setIsLoading(false);
          refetch();
        }}
        className={cn(
          "flex flex-col gap-2 ml-2 border-l-2 dark:border-slate-200 border-slate-800 pl-2 pb-1 space-y-2",
          recordDoneOpen ? "block" : "hidden"
        )}
      >
        <div className="flex flex-wrap gap-4">
          <div>
            <Label htmlFor="timeTaken">Time Taken (mins)</Label>
            <Input
              required
              min={0}
              type="number"
              id="timeTaken"
              className="w-24"
              placeholder="e.g. 30"
            />
          </div>
          <div>
            <Label htmlFor="marks">Marks (/20)</Label>
            <Input
              required
              min={0}
              max={20}
              type="number"
              id="marks"
              className="w-24"
              placeholder="e.g. 5"
            />
          </div>
        </div>
        <div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging..." : "Log"}
          </Button>
        </div>
      </form>
    </div>
  );
};
