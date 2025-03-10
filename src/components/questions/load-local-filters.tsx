"use client";

import { useQuestionsFilter } from "@/hooks/use-params";
import { defaultQuestionsFilter } from "@/lib/search-params";
import { useEffect } from "react";

export function LoadLocalFilters() {
  const [filter, setFilter] = useQuestionsFilter();

  useEffect(() => {
    const localFilters = localStorage.getItem("questionsFilter");
    const allNull = Object.values(filter).every((value) => value === null);
    if (allNull) {
      if (localFilters) {
        setFilter(JSON.parse(localFilters));
      } else {
        setFilter(defaultQuestionsFilter);
      }
    } else {
      localStorage.setItem("questionsFilter", JSON.stringify(filter));
    }
  }, [filter, setFilter]);

  return null;
}
