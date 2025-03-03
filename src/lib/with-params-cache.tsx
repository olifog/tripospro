import { partCache } from "./search-params";

type WithSearchParams<T = { [key: string]: string }> = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<T>;
};

export const withParamsCache = <P extends WithSearchParams<unknown>>(
  Component: React.ComponentType<P>
) => {
  return async function WithParamsCache(props: P) {
    await partCache.parse(props.searchParams);
    return <Component {...props} />;
  };
};
