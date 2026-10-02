import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildFrontend } from "../scripts/build-frontend.mjs";
import { syncAssets } from "../scripts/sync-assets.mjs";

test("the Pages build points at R2 and leaves media out of the upload", async () => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "portfolio-build-test-"),
  );
  try {
    const source = path.join(temporary, "frontend");
    const output = path.join(temporary, "output");
    await mkdir(path.join(source, "assets"), { recursive: true });
    await writeFile(
      path.join(source, "index.html"),
      '<img src="./assets/image.webp">',
    );
    await writeFile(path.join(source, "assets", "image.webp"), "media");

    await buildFrontend({
      sourceDirectory: source,
      outputDirectory: output,
      assetBaseUrl: "https://assets.example.com",
    });

    assert.equal(
      await readFile(path.join(output, "index.html"), "utf8"),
      '<img src="https://assets.example.com/image.webp">',
    );
    await assert.rejects(readFile(path.join(output, "assets", "image.webp")));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("a production build stamps its own deploy time into the footer", async () => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "portfolio-deploy-stamp-test-"),
  );
  try {
    const source = path.join(temporary, "frontend");
    const output = path.join(temporary, "output");
    await mkdir(source);
    await writeFile(
      path.join(source, "index.html"),
      '<div data-github-activity data-github-activity-preview></div><footer><div class="site-footer-meta"><!-- deploy-preview:start --><a href="/go/portfolio-deployments">Example production deploy</a><!-- deploy-preview:end --></div></footer>',
    );

    await buildFrontend({ sourceDirectory: source, outputDirectory: output });
    const previewHtml = await readFile(path.join(output, "index.html"), "utf8");
    assert.match(previewHtml, /Example production deploy/);
    assert.match(previewHtml, /data-github-activity-preview/);

    await buildFrontend({
      sourceDirectory: source,
      outputDirectory: output,
      productionBuildTime: "2026-10-02T14:20:00Z",
    });

    const html = await readFile(path.join(output, "index.html"), "utf8");
    assert.match(html, /Latest production deploy/);
    assert.match(html, /datetime="2026-10-02T14:20:00.000Z"/);
    assert.match(html, /href="\/go\/portfolio-deployments"/);
    assert.doesNotMatch(html, /Example production deploy/);
    assert.doesNotMatch(html, /<!-- deploy-preview:/);
    assert.doesNotMatch(html, /data-github-activity-preview/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("the asset sync skips identical R2 objects and updates changed files", async () => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "portfolio-sync-test-"),
  );
  try {
    const source = path.join(temporary, "assets");
    await mkdir(path.join(source, "reddit-videos", "v1.1.0"), {
      recursive: true,
    });
    const filename = path.join(
      source,
      "reddit-videos",
      "v1.1.0",
      "example-1.mp4",
    );
    await writeFile(filename, "first video");
    await writeFile(path.join(source, "README.md"), "not an asset");

    const objects = new Map();
    let uploads = 0;
    const runAws = (args) => {
      const key = args[args.indexOf("--key") + 1];
      if (args[1] === "head-object") {
        const object = objects.get(key);
        return object
          ? {
              status: 0,
              stdout: JSON.stringify({
                ContentLength: object.body.length,
                Metadata: { sha256: object.sha256 },
              }),
            }
          : { status: 255, stderr: "An error occurred (404)" };
      }
      if (args[1] === "cp") {
        const objectKey = args[3].split("/assets-test/")[1];
        const metadata = args[args.indexOf("--metadata") + 1];
        objects.set(objectKey, {
          body: Buffer.from(args[2] === filename ? content : ""),
          sha256: metadata.split("=")[1],
        });
        uploads++;
        return { status: 0, stdout: "" };
      }
      if (args[1] === "get-object") {
        writeFileSync(args.at(-1), objects.get(key).body);
        return { status: 0, stdout: "{}" };
      }
      throw new Error(`Unexpected command: ${args.join(" ")}`);
    };
    let content = "first video";
    const config = {
      sourceDirectory: source,
      bucket: "assets-test",
      endpoint: "https://example.r2.cloudflarestorage.com",
      runAws,
    };

    assert.deepEqual(await syncAssets(config), { uploaded: 1, skipped: 0 });
    assert.deepEqual(await syncAssets(config), { uploaded: 0, skipped: 1 });
    const key = "reddit-videos/v1.1.0/example-1.mp4";
    objects.get(key).sha256 = undefined;
    assert.deepEqual(await syncAssets(config), { uploaded: 0, skipped: 1 });
    content = "new video!!";
    await writeFile(filename, content);
    assert.deepEqual(await syncAssets(config), { uploaded: 1, skipped: 0 });
    assert.equal(uploads, 2);
    assert.equal(objects.size, 1);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
