"use client";

import { useContext, useState } from "react";
import CourseFilterContext from "./courseFilterContext";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { getCurrentYear } from "@/lib/utils";
import { useLocalStorage } from 'usehooks-ts'
import { ChevronDown } from "lucide-react";
import { ChevronRight } from "lucide-react";

const CheckboxWithLabel = ({
  id,
  checked,
  onCheckedChange,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  );
};

const HideCurrentYearCheckbox = () => {
  const { hideCurrentYear, setHideCurrentYear } = useContext(CourseFilterContext);
  return <CheckboxWithLabel id="hideCurrentYear" checked={hideCurrentYear} onCheckedChange={setHideCurrentYear} label="Hide current year" />;
};

const CurrentYearCheckbox = () => {
  const { onlyCurrent, setOnlyCurrent } = useContext(CourseFilterContext);
  return <CheckboxWithLabel id="onlyCurrent" checked={onlyCurrent} onCheckedChange={setOnlyCurrent} label="Only show currently taught courses" />;
};

const OnlyExaminedCheckbox = () => {
  const { onlyExamined, setOnlyExamined } = useContext(CourseFilterContext);
  return <CheckboxWithLabel id="onlyExamined" checked={onlyExamined} onCheckedChange={setOnlyExamined} label="Only show examined courses" />;
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
  const [onlyExamined, setOnlyExamined] = useLocalStorage("onlyExamined", true, {
    initializeWithValue: false,
  });
  const [hideCurrentYear, setHideCurrentYear] = useLocalStorage("hideCurrentYear", true, {
    initializeWithValue: false,
  });

  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <CourseFilterContext.Provider
      value={{ onlyCurrent, setOnlyCurrent, yearCutoff, setYearCutoff, onlyExamined, setOnlyExamined, hideCurrentYear, setHideCurrentYear }}
    >
      <div className="w-full flex flex-col space-y-1 mb-3 items-start">
        <button onClick={() => setOptionsOpen(!optionsOpen)} className="flex items-center space-x-2">
          Options
          {optionsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className={`flex space-x-12 w-full pl-2 ${optionsOpen ? "block" : "hidden"}`}>
          <div className="flex flex-col space-y-2">
            <HideCurrentYearCheckbox />
          </div>
          <div className="flex flex-col space-y-2">
            <CurrentYearCheckbox />
            <OnlyExaminedCheckbox />
          </div>
          <YearCutoffInput />
        </div>
      </div>
      {children}
    </CourseFilterContext.Provider>
  );
};
