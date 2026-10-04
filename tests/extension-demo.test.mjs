import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("image downloads use the full-resolution demo assets", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("../frontend/index.html", import.meta.url), "utf8"),
    readFile(
      new URL("../frontend/components/extension-demo.js", import.meta.url),
      "utf8",
    ),
  ]);

  const downloadSources = [
    ...html.matchAll(/data-download-src="([^"]+)"/g),
  ].map((match) => match[1]);

  assert.deepEqual(downloadSources, [
    "./assets/extension-demo/robin.webp",
    "./assets/extension-demo/blue-tit.webp",
    "./assets/extension-demo/goldfinch.webp",
    "./assets/extension-demo/robin.webp",
  ]);
  assert.match(script, /fetch\(item\.downloadSrc\)/);
});
