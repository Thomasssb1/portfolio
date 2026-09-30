import assert from "node:assert/strict";
import test from "node:test";

import {
  redditVideoExamples,
  redditVideoKeyPrefix,
  redditVideoUrl,
} from "../frontend/components/reddit-video-assets.js";

test("all Reddit examples use versioned URLs on the asset domain", () => {
  assert.equal(redditVideoExamples.length, 7);
  for (const name of redditVideoExamples) {
    assert.equal(
      redditVideoUrl(name, "example.com"),
      `https://assets.example.com/${redditVideoKeyPrefix}/${name}.mp4`,
    );
  }
});

test("local and Pages preview hosts use the GitHub release", () => {
  const releaseUrl =
    "https://github.com/Thomasssb1/reddit-2-video/releases/download/v1.1.0/example-1.mp4";
  assert.equal(redditVideoUrl("example-1", "localhost"), releaseUrl);
  assert.equal(redditVideoUrl("example-1", "portfolio.pages.dev"), releaseUrl);
});

test("unknown Reddit examples cannot generate a video URL", () => {
  assert.throws(() => redditVideoUrl("missing", "example.com"));
});
