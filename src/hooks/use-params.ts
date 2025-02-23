"use client";

import { partSearchParam } from "@/lib/search-params";
import { useQueryState } from "nuqs";

export const usePart = () => useQueryState("part", partSearchParam);
