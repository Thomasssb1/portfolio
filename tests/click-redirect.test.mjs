import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/go/[slug].js";

const destinations = {
  github: "https://github.com/Thomasssb1",
  "portfolio-source": "https://github.com/Thomasssb1/portfolio",
  "portfolio-deployments":
    "https://github.com/Thomasssb1/portfolio/deployments/production",
  linkedin: "https://www.linkedin.com/in/thomas-beer04/",
  idbs: "https://www.idbs.com/",
  "reddit-2-video": "https://github.com/Thomasssb1/reddit-2-video",
  "ytdl-app": "https://github.com/Thomasssb1/ytdl_app",
  ytdl: "https://github.com/Thomasssb1/ytdl",
  "bird-tracker-video": "https://youtu.be/RZ105B2EbC4",
  overseer: "https://github.com/Thomasssb1/overseer",
  "behaviour-tree": "https://github.com/red-shock/behaviour-tree",
  "title-carousel": "https://github.com/Thomasssb1/title_carousel",
  "streamlit-editjson": "https://github.com/Thomasssb1/streamlit-editjson",
  "mass-image-downloader": "https://github.com/red-shock/Mass-Image-Downloader",
  "table-to-csv": "https://github.com/red-shock/Table-To-CSV",
  "reddit-2-video-docs": "https://thomasssb1.github.io/reddit-2-video/",
  "reddit-2-video-releases":
    "https://github.com/Thomasssb1/reddit-2-video/releases",
  "reddit-2-video-workings":
    "https://github.com/Thomasssb1/reddit-2-video/blob/master/WORKINGS.md",
  "meta-research":
    "https://communityforums.atmeta.com/discussions/News_and_Announcements/calling-all-unity-and-unreal-developers-%E2%80%94join-meta%E2%80%99s-arvr-research-panel/1351027",
};

for (const [slug, destination] of Object.entries(destinations)) {
  test(`${slug} redirects and records only its name`, () => {
    const writes = [];
    const response = onRequest({
      request: new Request(`https://example.com/go/${slug}`),
      env: { CLICKS: { writeDataPoint: (point) => writes.push(point) } },
      params: { slug },
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("Location"), destination);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
    assert.deepEqual(writes, [{ blobs: [slug] }]);
  });
}

test("unknown paths do not redirect or record a click", () => {
  const writes = [];
  const response = onRequest({
    request: new Request("https://example.com/go/__proto__"),
    env: { CLICKS: { writeDataPoint: (point) => writes.push(point) } },
    params: { slug: "__proto__" },
  });

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("Location"), null);
  assert.deepEqual(writes, []);
});

test("local development redirects without an Analytics Engine binding", () => {
  const response = onRequest({
    request: new Request("https://example.com/go/github"),
    env: {},
    params: { slug: "github" },
  });
  assert.equal(response.status, 302);
});

test("HEAD redirects without recording a click", () => {
  const writes = [];
  const response = onRequest({
    request: new Request("https://example.com/go/github", { method: "HEAD" }),
    env: { CLICKS: { writeDataPoint: (point) => writes.push(point) } },
    params: { slug: "github" },
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), destinations.github);
  assert.deepEqual(writes, []);
});

test("unsupported methods cannot record clicks", () => {
  const writes = [];
  const response = onRequest({
    request: new Request("https://example.com/go/github", { method: "POST" }),
    env: { CLICKS: { writeDataPoint: (point) => writes.push(point) } },
    params: { slug: "github" },
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
  assert.deepEqual(writes, []);
});
