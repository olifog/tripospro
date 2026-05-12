"use client";

import { useQuestionsFilter } from "@/hooks/use-params";
import { defaultQuestionsFilter } from "@/lib/search-params";
import { useEffect, useRef } from "react";

export function LoadLocalFilters() {
  const [filter, setFilter] = useQuestionsFilter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      localStorage.setItem("questionsFilter", JSON.stringify(filter));
      return;
    }

    const allNull = Object.values(filter).every((value) => value === null);
    if (allNull) {
      try {
        const localFilters = localStorage.getItem("questionsFilter");
        if (localFilters) {
          setFilter(JSON.parse(localFilters));
        } else {
          setFilter(defaultQuestionsFilter);
        }
      } catch {
        setFilter(defaultQuestionsFilter);
      }
    }
    initialized.current = true;
  }, [filter, setFilter]);

  return null;
}
