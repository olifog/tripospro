import { createContext } from "react";

type CourseFilterContextType = {
  onlyCurrent: boolean;
  setOnlyCurrent: (onlyCurrent: boolean) => void;
  yearCutoff: string;
  setYearCutoff: (yearCutoff: string) => void;
  onlyExamined: boolean;
  setOnlyExamined: (onlyExamined: boolean) => void;
  hideCurrentYear: boolean;
  setHideCurrentYear: (hideCurrentYear: boolean) => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
};

const CourseFilterContext = createContext<CourseFilterContextType>({
  onlyCurrent: true,
  setOnlyCurrent: () => {},
  yearCutoff: "2019",
  setYearCutoff: () => {},
  onlyExamined: true,
  setOnlyExamined: () => {},
  hideCurrentYear: true,
  setHideCurrentYear: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
});

export default CourseFilterContext;
