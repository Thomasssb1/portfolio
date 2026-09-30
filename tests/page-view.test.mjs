import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/index.js";

const html = new Response("<html></html>", {
  headers: { "content-type": "text/html; charset=utf-8" },
});

async function visit(
  path,
  { method = "GET", response = html, binding = true } = {},
) {
  const writes = [];
  const result = await onRequest({
    request: new Request(`https://example.com/${path}`, { method }),
    env: binding
      ? { CLICKS: { writeDataPoint: (point) => writes.push(point) } }
      : {},
    next: async () => response,
  });

  assert.equal(result, response);
  return writes;
}

test("untagged homepage views are counted", async () => {
  assert.deepEqual(await visit(""), [{ blobs: ["pageview", "untagged"] }]);
});

test("accepted source tags are counted in lower case", async () => {
  assert.deepEqual(await visit("?CV"), [{ blobs: ["pageview", "cv"] }]);
  assert.deepEqual(await visit("?linkedin"), [
    { blobs: ["pageview", "linkedin"] },
  ]);
});

test("unknown tags, query values, and multiple tags are not stored", async () => {
  assert.deepEqual(await visit("?github"), [
    { blobs: ["pageview", "untagged"] },
  ]);
  assert.deepEqual(await visit("?email=someone%40example.com"), [
    { blobs: ["pageview", "untagged"] },
  ]);
  assert.deepEqual(await visit("?cv&linkedin"), [
    { blobs: ["pageview", "untagged"] },
  ]);
  assert.deepEqual(await visit("?cv&email=someone%40example.com"), [
    { blobs: ["pageview", "untagged"] },
  ]);
  assert.deepEqual(await visit("?cv="), [{ blobs: ["pageview", "untagged"] }]);
});

test("malformed or oversized tags are not stored", async () => {
  assert.deepEqual(await visit("?123"), [{ blobs: ["pageview", "untagged"] }]);
  assert.deepEqual(await visit(`?${"a".repeat(25)}`), [
    { blobs: ["pageview", "untagged"] },
  ]);
});

test("HEAD and unsuccessful or non-HTML responses are not counted", async () => {
  assert.deepEqual(await visit("?cv", { method: "HEAD" }), []);
  assert.deepEqual(
    await visit("?cv", { response: new Response("no", { status: 404 }) }),
    [],
  );
  assert.deepEqual(await visit("?cv", { response: new Response("css") }), []);
});

test("local development serves the homepage without a binding", async () => {
  assert.deepEqual(await visit("?cv", { binding: false }), []);
});
