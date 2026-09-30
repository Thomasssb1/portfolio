import assert from "node:assert/strict";
import test from "node:test";

import { setupCaseStudyVideoPlayer } from "../frontend/components/case-study-video-player.js";

function element() {
  const listeners = new Map();
  const attributes = new Map();
  return {
    listeners,
    attributes,
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    emit(name) {
      listeners.get(name)?.();
    },
  };
}

test("custom gameplay controls play, seek, pause and mute", () => {
  let actualTime = 0;
  let requestedTime = null;
  const video = Object.assign(element(), {
    controls: true,
    duration: 60,
    currentTime: 0,
    paused: true,
    ended: false,
    muted: false,
    volume: 1,
    play() {
      this.paused = false;
      this.emit("play");
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
      this.emit("pause");
    },
  });
  Object.defineProperty(video, "currentTime", {
    get: () => actualTime,
    set: (value) => {
      requestedTime = value;
    },
  });
  const main = element();
  const toggle = element();
  const label = element();
  const time = element();
  const mute = element();
  const fullscreen = element();
  const seek = Object.assign(element(), {
    value: "0",
    disabled: true,
    style: { setProperty() {} },
  });
  const classes = new Set();
  const controls = {
    video,
    "[data-video-ui]": element(),
    ".case-study-player-main": main,
    "[data-video-main-label]": label,
    "[data-video-seek]": seek,
    "[data-video-time]": time,
    "[data-video-mute]": mute,
    "[data-video-fullscreen]": fullscreen,
  };
  const frame = {
    querySelector: (selector) => controls[selector],
    querySelectorAll: () => [main, toggle],
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, enabled) =>
        enabled ? classes.add(name) : classes.delete(name),
    },
  };

  setupCaseStudyVideoPlayer(frame);
  assert.equal(video.controls, false);
  assert.equal(seek.disabled, false);
  assert.equal(time.textContent, "0:00 / 1:00");

  main.emit("click");
  assert.equal(video.paused, false);
  assert.equal(main.hidden, true);
  assert.equal(toggle.attributes.get("aria-label"), "Pause gameplay video");

  seek.value = "50";
  seek.emit("input");
  assert.equal(requestedTime, null);
  assert.equal(seek.value, "50");
  assert.equal(time.textContent, "0:30 / 1:00");
  video.emit("timeupdate");
  assert.equal(seek.value, "50");
  seek.emit("change");
  assert.equal(requestedTime, 30);
  video.emit("timeupdate");
  assert.equal(seek.value, "50");
  actualTime = 30;
  video.emit("seeked");
  assert.equal(seek.value, "50");

  toggle.emit("click");
  assert.equal(video.paused, true);
  assert.equal(main.hidden, false);
  assert.equal(label.textContent, "Resume gameplay");

  mute.emit("click");
  video.emit("volumechange");
  assert.equal(video.muted, true);
  assert.equal(mute.attributes.get("aria-label"), "Unmute gameplay video");
});
