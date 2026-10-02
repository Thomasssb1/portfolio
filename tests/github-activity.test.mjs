import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/api/github-activity.js";

const request = new Request("https://thomasbeer.uk/api/github-activity");
const calendar = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: [
            {
              firstDay: "2026-09-20",
              contributionDays: [
                { contributionCount: 2 },
                { contributionCount: 3 },
              ],
            },
            {
              firstDay: "2026-09-27",
              contributionDays: [{ contributionCount: 0 }],
            },
          ],
        },
      },
    },
  },
};

test("the activity endpoint needs its server-side token", async () => {
  const response = await onRequest({ request, env: {} });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.doesNotMatch(await response.text(), /token/i);
});

test("the activity endpoint returns weekly counts without exposing the token", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.github.com/graphql");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.deepEqual(JSON.parse(options.body).variables, {
      login: "Thomasssb1",
    });
    return Response.json(calendar);
  });

  const response = await onRequest({
    request,
    env: { GITHUB_ACTIVITY_TOKEN: "test-secret" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=3600");
  assert.deepEqual(await response.json(), {
    weeks: [
      { start: "2026-09-20", count: 5 },
      { start: "2026-09-27", count: 0 },
    ],
  });
});

test("a successful calendar is reused from the edge cache", async (t) => {
  const originalCaches = globalThis.caches;
  let cachedResponse;
  globalThis.caches = {
    default: {
      match: async (key) => {
        assert.equal(key.url, request.url);
        return cachedResponse?.clone();
      },
      put: async (key, response) => {
        assert.equal(key.url, request.url);
        cachedResponse = response.clone();
      },
    },
  };
  t.after(() => {
    globalThis.caches = originalCaches;
  });
  const githubFetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json(calendar),
  );

  const context = {
    request,
    env: { GITHUB_ACTIVITY_TOKEN: "test-secret" },
  };
  const first = await onRequest(context);
  const second = await onRequest(context);
  assert.deepEqual(await first.json(), await second.json());
  assert.equal(githubFetch.mock.callCount(), 1);
});

test("GitHub errors return an uncached unavailable response", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ errors: [{ message: "Rate limited" }] }),
  );

  const response = await onRequest({
    request,
    env: { GITHUB_ACTIVITY_TOKEN: "test-secret" },
  });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("only GET can request activity", async () => {
  const response = await onRequest({
    request: new Request(request.url, { method: "POST" }),
    env: { GITHUB_ACTIVITY_TOKEN: "test-secret" },
  });
  assert.equal(response.status, 405);
});
