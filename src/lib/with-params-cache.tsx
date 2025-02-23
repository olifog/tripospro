import { partCache } from "./search-params";

type WithSearchParams = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ [key: string]: string }>;
};

export const withParamsCache = <P extends WithSearchParams>(
  Component: React.ComponentType<P>
) => {
  return async function WithParamsCache(props: P) {
    await partCache.parse(props.searchParams);
    return <Component {...props} />;
  };
};
