"use client";

import { createAnswer } from "@/actions/question";
import { Button } from "./ui/button";

export const MarkDoneButton = ({
  questionId,
  userId,
}: {
  questionId?: number;
  userId?: string;
}) => {

  return (
    <Button
      onClick={async () => {
        if (!questionId || !userId) return;
        await createAnswer({
          questionId: questionId,
          userId: userId,
        });
      }}
    >
      Mark as Done
    </Button>
  );
};
