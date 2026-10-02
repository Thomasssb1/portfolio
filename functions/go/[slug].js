const destinations = new Map([
  ["github", "https://github.com/Thomasssb1"],
  ["portfolio-source", "https://github.com/Thomasssb1/portfolio"],
  ["linkedin", "https://www.linkedin.com/in/thomas-beer04/"],
  ["idbs", "https://www.idbs.com/"],
  ["reddit-2-video", "https://github.com/Thomasssb1/reddit-2-video"],
  ["ytdl-app", "https://github.com/Thomasssb1/ytdl_app"],
  ["ytdl", "https://github.com/Thomasssb1/ytdl"],
  ["bird-tracker-video", "https://youtu.be/RZ105B2EbC4"],
  ["overseer", "https://github.com/Thomasssb1/overseer"],
  ["behaviour-tree", "https://github.com/red-shock/behaviour-tree"],
  ["title-carousel", "https://github.com/Thomasssb1/title_carousel"],
  ["streamlit-editjson", "https://github.com/Thomasssb1/streamlit-editjson"],
  [
    "mass-image-downloader",
    "https://github.com/red-shock/Mass-Image-Downloader",
  ],
  ["table-to-csv", "https://github.com/red-shock/Table-To-CSV"],
  ["reddit-2-video-docs", "https://thomasssb1.github.io/reddit-2-video/"],
  [
    "reddit-2-video-releases",
    "https://github.com/Thomasssb1/reddit-2-video/releases",
  ],
  [
    "reddit-2-video-workings",
    "https://github.com/Thomasssb1/reddit-2-video/blob/master/WORKINGS.md",
  ],
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
