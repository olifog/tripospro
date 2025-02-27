import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const partSearchParam = parseAsString.withOptions({
  shallow: false
});
export const defaultPartCode = "1a";

export const getPart = () => partCache.get("part");
export const partCache = createSearchParamsCache({
  part: partSearchParam
});
