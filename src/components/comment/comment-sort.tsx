"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export type SortOption = "date_desc" | "date_asc" | "votes_desc" | "votes_asc";

const options: { value: SortOption; label: string }[] = [
  { value: "votes_desc", label: "Votes" },
  { value: "date_desc", label: "Date" }
];

export function CommentSort({
  value,
  onChange
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const activeField = value.startsWith("votes") ? "votes" : "date";
  const isAsc = value.endsWith("_asc");

  const handleClick = (field: "votes" | "date") => {
    if (activeField === field) {
      onChange(
        isAsc
          ? (`${field}_desc` as SortOption)
          : (`${field}_asc` as SortOption)
      );
    } else {
      onChange(`${field}_desc` as SortOption);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {options.map((opt) => {
        const field = opt.value.startsWith("votes") ? "votes" : "date";
        const isActive = activeField === field;
        return (
          <Button
            key={opt.value}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => handleClick(field)}
          >
            {opt.label}
            {isActive && (
              isAsc
                ? <ArrowUp className="h-3 w-3" />
                : <ArrowDown className="h-3 w-3" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
