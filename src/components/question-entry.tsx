"use client";

import { Check } from "lucide-react";
import { markTextColorStyle } from "@/lib/score-colors";

export type QuestionEntryData = {
  year: number;
  paperName: string;
  questionNumber: number;
  minimumMark?: number | null;
  medianMark?: number | null;
  maximumMark?: number | null;
  attempts?: number | null;
  candidates?: number | null;
  bestMark?: number | null;
  topics?: string[];
};

export function QuestionEntryRow({ q }: { q: QuestionEntryData }) {
  const popularity =
    q.attempts && q.candidates && q.candidates > 0
      ? Math.round((q.attempts / q.candidates) * 100)
      : null;

  return (
    <>
      <span className="w-10 shrink-0 font-mono text-muted-foreground">
        {q.year}
      </span>
      <span className="w-14 shrink-0 font-medium">
        P{q.paperName}Q{q.questionNumber}
      </span>
      {/* Min / Med / Max */}
      <div className="flex w-[4.5rem] shrink-0 gap-0.5 font-mono text-[11px]">
        <MarkValue value={q.minimumMark} />
        <span className="text-muted-foreground">/</span>
        <MarkValue value={q.medianMark} />
        <span className="text-muted-foreground">/</span>
        <MarkValue value={q.maximumMark} />
      </div>
      {/* Popularity */}
      <span className="w-7 shrink-0 font-mono text-[11px] text-muted-foreground">
        {popularity !== null ? `${popularity}%` : ""}
      </span>
      {/* User's mark + check */}
      <span className="flex w-12 shrink-0 items-center gap-0.5 font-mono text-[11px]">
        {q.bestMark != null ? (
          <>
            <Check className="h-3 w-3 text-green-500" />
            <span style={markTextColorStyle(q.bestMark)}>{q.bestMark}</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </span>
      {/* Topics */}
      {q.topics && q.topics.length > 0 && (
        <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
          {q.topics.slice(0, 2).map((t) => (
            <span
              key={t}
              className="truncate rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function MarkValue({ value }: { value?: number | null }) {
  if (value == null) return <span className="text-muted-foreground">-</span>;
  return <span style={markTextColorStyle(value)}>{value}</span>;
}
