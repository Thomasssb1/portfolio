import assert from "node:assert/strict";
import test from "node:test";

import {
  videoExamples,
  videoKeyPrefix,
  videoUrl,
} from "../frontend/components/video-assets.js";

test("all video examples use versioned URLs on the asset domain", () => {
  assert.equal(videoExamples.length, 7);
  for (const name of videoExamples) {
    assert.equal(
      videoUrl(name, "example.com"),
      `https://assets.example.com/${videoKeyPrefix}/${name}.mp4`,
    );
  }
});

test("local and Pages preview hosts use the GitHub release", () => {
  const releaseUrl =
    "https://github.com/Thomasssb1/reddit-2-video/releases/download/v1.1.0/example-1.mp4";
  assert.equal(videoUrl("example-1", "localhost"), releaseUrl);
  assert.equal(videoUrl("example-1", "portfolio.pages.dev"), releaseUrl);
});

test("unknown video examples cannot generate a video URL", () => {
  assert.throws(() => videoUrl("missing", "example.com"));
});
