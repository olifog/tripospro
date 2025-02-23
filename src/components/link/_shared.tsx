export function getHrefWithPart(href: string, part: string) {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    url = new URL(href, "http://dummy-base");
  }

  if (!url.searchParams.has("part") && part) {
    url.searchParams.set("part", part);
  }

  return `${url.pathname}${url.search}`;
}
