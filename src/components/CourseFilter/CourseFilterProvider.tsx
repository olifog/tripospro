"use client";

import { useContext, useState } from "react";
import CourseFilterContext from "./courseFilterContext";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { getCurrentYear } from "@/lib/utils";
import { useLocalStorage } from 'usehooks-ts'

const CurrentYearCheckbox = () => {
  const { onlyCurrent, setOnlyCurrent } = useContext(CourseFilterContext);
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="currentYear"
        checked={onlyCurrent}
        onCheckedChange={setOnlyCurrent}
      />
      <label
        htmlFor="currentYear"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Only show currently taught courses
      </label>
    </div>
  );
};

const YearCutoffInput = () => {
  const { yearCutoff, setYearCutoff } = useContext(CourseFilterContext);

  return (
    <div className="flex flex-col space-y-2">
      <Label
        htmlFor="yearCutoff"
        className="text-slate-700 dark:text-slate-300"
      >
        Year cutoff:{" "}
        <span className="text-slate-900 dark:text-slate-100">
          {yearCutoff}
        </span>
      </Label>
      <Slider
        id="yearCutoff"
        value={yearCutoff ? [parseInt(yearCutoff)] : [1993]}
        onValueChange={([value]) =>
          setYearCutoff(
            value.toString()
          )
        }
        min={1993}
        max={parseInt(getCurrentYear())}
        step={1}
      />
    </div>
  );
};

export const CourseFilterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [onlyCurrent, setOnlyCurrent] = useLocalStorage("onlyCurrent", true, {
    initializeWithValue: false,
  });
  const [yearCutoff, setYearCutoff] = useLocalStorage("yearCutoff", "2020", {
    initializeWithValue: false,
  });

  return (
    <CourseFilterContext.Provider
      value={{ onlyCurrent, setOnlyCurrent, yearCutoff, setYearCutoff }}
    >
      <div className="flex space-x-12 mb-2">
        <CurrentYearCheckbox />
        <YearCutoffInput />
      </div>
      {children}
    </CourseFilterContext.Provider>
  );
};
