"use client";

import {
  partSearchParam,
  questionsFilterSearchParams
} from "@/lib/search-params";
import { useQueryState, useQueryStates } from "nuqs";

export const usePart = () => useQueryState("part", partSearchParam);

export const useQuestionsFilter = () =>
  useQueryStates(questionsFilterSearchParams, {
    clearOnDefault: false
  });
