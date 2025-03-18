import {
  createSearchParamsCache,
  type inferParserType,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum
} from "nuqs/server";

export const partSearchParam = parseAsString.withOptions({
  shallow: false
});
export const defaultPartCode = "part1a";

export const getPart = () => partCache.get("part");
export const partCache = createSearchParamsCache({
  part: partSearchParam
});

export const questionsFilterSearchParams = {
  yearCutoff: parseAsInteger,
  onlyCurrent: parseAsBoolean,
  view: parseAsStringEnum(["course", "paper"]),
  search: parseAsString,
  showQuestionNumbers: parseAsBoolean
};

export const defaultQuestionsFilter = {
  yearCutoff: 2019,
  onlyCurrent: false,
  view: "course",
  search: "",
  showQuestionNumbers: false
} as const;

export const questionsFilterCache = createSearchParamsCache(
  questionsFilterSearchParams
);
export const getQuestionsFilter = () => {
  return Object.fromEntries(
    Object.entries(questionsFilterCache.all()).map(([key, value]) => [
      key,
      value ??
        defaultQuestionsFilter[key as keyof typeof defaultQuestionsFilter]
    ])
  ) as inferParserType<typeof questionsFilterSearchParams>;
};
