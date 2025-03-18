"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { useQuestionsFilter } from "@/hooks/use-params";
import { defaultQuestionsFilter } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Info } from "lucide-react";
import { useEffect, useState } from "react";
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

export const ViewOptions = () => {
  const [filter, setFilter] = useQuestionsFilter();
  const [open, setOpen] = useState(true);
  const [sliderValue, setSliderValue] = useState(
    filter.yearCutoff ?? defaultQuestionsFilter.yearCutoff
  );
  const debouncedSliderValue = useDebounce(sliderValue, 300);

  useEffect(() => {
    setFilter({ ...filter, yearCutoff: debouncedSliderValue });
  }, [debouncedSliderValue]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-8">
        <CollapsibleTrigger className="flex cursor-pointer items-center gap-1 text-sm">
          Options
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              !open && "rotate-[-90deg]"
            )}
          />
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search"
            value={filter.search ?? defaultQuestionsFilter.search}
            onChange={(e) => {
              setFilter({
                ...filter,
                search: e.target.value
              });
            }}
          />
        </div>
      </div>
      <CollapsibleContent>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Group by:</Label>
            <Tabs
              value={filter.view ?? defaultQuestionsFilter.view}
              onValueChange={(value) => {
                if (value === "course" || value === "paper") {
                  setFilter({
                    ...filter,
                    view: value
                  });
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="course">Course</TabsTrigger>
                <TabsTrigger value="paper">Paper</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <Label className="w-[150px] text-sm">
              Only 'current' {filter.view}s:
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {filter.view === "course"
                      ? `Filter to only courses that are currently taught.
                      This will hide irrelevant old courses, but will also hide old versions of current
                      courses that used to have a different name.`
                      : `Only show papers that are currently taught for this Tripos Part.
                      This will hide any old papers that used to be examined for this part.`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch
              checked={filter.onlyCurrent ?? defaultQuestionsFilter.onlyCurrent}
              onCheckedChange={(checked) => {
                setFilter({ ...filter, onlyCurrent: checked });
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Year cutoff:</Label>
            <span className="w-8 text-muted-foreground text-sm">
              {sliderValue}
            </span>
            <Slider
              className="w-24"
              min={1993}
              max={new Date().getFullYear()}
              value={[sliderValue]}
              onValueChange={(value) => {
                setSliderValue(value[0]);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Show question numbers:</Label>
            <Switch
              checked={
                filter.showQuestionNumbers ??
                defaultQuestionsFilter.showQuestionNumbers
              }
              onCheckedChange={(checked) => {
                setFilter({ ...filter, showQuestionNumbers: checked });
              }}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
