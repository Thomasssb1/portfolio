const destinations = new Map([
  ["github", "https://github.com/Thomasssb1"],
  ["linkedin", "https://www.linkedin.com/in/thomas-beer04/"],
  ["idbs", "https://www.idbs.com/"],
  [
    "meta-research",
    "https://communityforums.atmeta.com/discussions/News_and_Announcements/calling-all-unity-and-unreal-developers-%E2%80%94join-meta%E2%80%99s-arvr-research-panel/1351027",
  ],
]);

export function onRequest({ request, env, params }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const slug = params.slug;
  const destination = destinations.get(slug);

  if (!destination) {
    return new Response(request.method === "HEAD" ? null : "Not found", {
      status: 404,
    });
  }

  if (request.method === "GET") {
    env.CLICKS?.writeDataPoint({ blobs: [slug] });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
