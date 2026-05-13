"use client";

import { useUser } from "@clerk/nextjs";
import { Label } from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Info, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuestionsFilter } from "@/hooks/use-params";
import { defaultQuestionsFilter } from "@/lib/search-params";
import { gradientCss } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";

const ScoreLegend = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-default items-center gap-1">
          <div
            className="h-3 w-16 rounded-sm"
            style={{ background: gradientCss }}
          />
          <div className="h-3 w-3 rounded-sm bg-score-unattempted/30" />
          <Info className="ml-0.5 h-3 w-3 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-col gap-1.5 p-2">
        <p className="mb-0.5 font-medium text-xs">Score colors (/20)</p>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-24 shrink-0 rounded-sm"
            style={{ background: gradientCss }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground" style={{ width: "6rem" }}>
          <span>0</span>
          <span>10</span>
          <span>20</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 shrink-0 rounded-sm bg-score-done" />
          <span className="text-xs">attempted (no mark)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 shrink-0 rounded-sm bg-score-unattempted/30" />
          <span className="text-xs">unattempted</span>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const ViewOptions = () => {
  const [filter, setFilter] = useQuestionsFilter();
  const [open, setOpen] = useState(true);
  const [sliderValue, setSliderValue] = useState(
    filter.yearCutoff ?? defaultQuestionsFilter.yearCutoff
  );
  const debouncedSliderValue = useDebounce(sliderValue, 300);
  const sliderInitialized = useRef(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    setSliderValue(filter.yearCutoff ?? defaultQuestionsFilter.yearCutoff);
  }, [filter.yearCutoff]);

  useEffect(() => {
    if (!sliderInitialized.current) {
      sliderInitialized.current = true;
      return;
    }
    setFilter((prev) => ({ ...prev, yearCutoff: debouncedSliderValue }));
  }, [debouncedSliderValue, setFilter]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-3">
        <CollapsibleTrigger className="flex cursor-pointer items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground">
          Filters
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
        </CollapsibleTrigger>

        <Input
          placeholder="Search courses…"
          className="h-8 w-48 text-sm"
          value={filter.search ?? defaultQuestionsFilter.search}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, search: e.target.value }))
          }
        />

        {isSignedIn && (
          <button
            type="button"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                onlyStarred: !(prev.onlyStarred ?? false)
              }))
            }
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors",
              (filter.onlyStarred ?? false)
                ? "border-warning/60 bg-warning/10 text-warning"
                : "border-border text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                (filter.onlyStarred ?? false) && "fill-warning text-warning"
              )}
            />
            Starred
          </button>
        )}

        <ScoreLegend />
      </div>

      <CollapsibleContent>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-1">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">Group by</Label>
            <Tabs
              value={filter.view ?? defaultQuestionsFilter.view}
              onValueChange={(value) => {
                if (value === "course" || value === "paper") {
                  setFilter((prev) => ({ ...prev, view: value }));
                }
              }}
            >
              <TabsList className="h-7">
                <TabsTrigger value="course" className="h-5 text-xs">
                  Course
                </TabsTrigger>
                <TabsTrigger value="paper" className="h-5 text-xs">
                  Paper
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">
              Only current
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-56 text-xs">
                  {filter.view === "course"
                    ? "Filter to courses currently taught. Hides old versions of renamed courses."
                    : "Show only papers currently examined for this Tripos Part."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch
              className="scale-75"
              checked={filter.onlyCurrent ?? defaultQuestionsFilter.onlyCurrent}
              onCheckedChange={(checked) =>
                setFilter((prev) => ({ ...prev, onlyCurrent: checked }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">From</Label>
            <span className="w-10 text-right text-muted-foreground text-sm tabular-nums">
              {sliderValue}
            </span>
            <Slider
              className="w-28"
              min={1993}
              max={new Date().getFullYear()}
              value={[sliderValue ?? defaultQuestionsFilter.yearCutoff]}
              onValueChange={(value) => setSliderValue(value[0])}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">
              Question numbers
            </Label>
            <Switch
              className="scale-75"
              checked={
                filter.showQuestionNumbers ??
                defaultQuestionsFilter.showQuestionNumbers
              }
              onCheckedChange={(checked) =>
                setFilter((prev) => ({
                  ...prev,
                  showQuestionNumbers: checked
                }))
              }
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
