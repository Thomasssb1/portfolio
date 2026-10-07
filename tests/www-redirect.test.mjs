import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/_middleware.js";

function configBinding(canonicalHostname) {
  return {
    ASSETS: {
      fetch: (request) => {
        assert.equal(new URL(request.url).pathname, "/site-config.json");
        return Response.json({ canonicalHostname });
      },
    },
  };
}

for (const canonicalHostname of ["thomasbeer.uk", "example.com"]) {
  test(`HTTP and HTTPS WWW requests redirect to ${canonicalHostname} before handlers run`, async () => {
    for (const scheme of ["http", "https"]) {
      for (const path of [
        "/",
        "/styles.css",
        "/go/github",
        "/api/github-activity",
      ]) {
        const response = await onRequest({
          request: new Request(
            `${scheme}://www.${canonicalHostname}${path}?cv&value=a%2Fb`,
          ),
          env: configBinding(canonicalHostname),
          next: () => assert.fail("WWW requests must not invoke site handlers"),
        });

        assert.equal(response.status, 301);
        assert.equal(
          response.headers.get("location"),
          `https://${canonicalHostname}${path}?cv&value=a%2Fb`,
        );
      }
    }
  });
}

test("the root domain, previews, and local requests reach site handlers", async () => {
  const html = new Response("site");
  for (const host of [
    "thomasbeer.uk",
    "portfolio.pages.dev",
    "preview.portfolio.pages.dev",
    "localhost:8788",
    "www.thomasbeer.uk.example.com",
    "www.example.com",
  ]) {
    assert.equal(
      await onRequest({
        request: new Request(`https://${host}/?cv`),
        env: configBinding("thomasbeer.uk"),
        next: () => html,
      }),
      html,
    );
  }
});
