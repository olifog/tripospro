"use client";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

export type SortOption = "hot" | "top" | "new";

export function CommentSort({
  value,
  onChange
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as SortOption)}
    >
      <TabsList className="h-7">
        <TabsTrigger value="hot" className="text-xs px-2 h-5">
          Hot
        </TabsTrigger>
        <TabsTrigger value="top" className="text-xs px-2 h-5">
          Top
        </TabsTrigger>
        <TabsTrigger value="new" className="text-xs px-2 h-5">
          New
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
