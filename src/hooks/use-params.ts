"use client";

import { useQueryState, useQueryStates } from "nuqs";
import {
  partSearchParam,
  questionsFilterSearchParams
} from "@/lib/search-params";

export const usePart = () => useQueryState("part", partSearchParam);

export const useQuestionsFilter = () =>
  useQueryStates(questionsFilterSearchParams, {
    clearOnDefault: false
  });
