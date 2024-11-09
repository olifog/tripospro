import { createContext } from "react";

type CourseFilterContextType = {
  onlyCurrent: boolean;
  setOnlyCurrent: (onlyCurrent: boolean) => void;
  yearCutoff?: string;
  setYearCutoff: (yearCutoff: string) => void;
};

const CourseFilterContext = createContext<CourseFilterContextType>({
  onlyCurrent: true,
  setOnlyCurrent: () => {},
  yearCutoff: "2020",
  setYearCutoff: () => {},
});

export default CourseFilterContext;
