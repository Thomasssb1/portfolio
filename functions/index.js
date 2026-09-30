const PAGE_VIEW = "pageview";
const UNTAGGED = "untagged";
const ACCEPTED_TAGS = new Set(["cv", "linkedin"]);

function sourceTag(url) {
  const tag = new URL(url).search.slice(1).toLowerCase();
  return ACCEPTED_TAGS.has(tag) ? tag : UNTAGGED;
}

export async function onRequest({ request, env, next }) {
  const response = await next();

  if (
    request.method === "GET" &&
    response.status === 200 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    env.CLICKS?.writeDataPoint({ blobs: [PAGE_VIEW, sourceTag(request.url)] });
  }

  return response;
}
