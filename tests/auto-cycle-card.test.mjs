import assert from "node:assert/strict";
import test from "node:test";

import { createAutoCycleCard } from "../frontend/components/auto-cycle-card.js";

test("the preview stops cycling while hovered or while the dialog is open", () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const listeners = new Map();
  const rendered = [];
  let tick;
  let cleared = false;
  let dialogOpen = false;

  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    setInterval(callback) {
      tick = callback;
      return 1;
    },
    clearInterval() {
      cleared = true;
    },
  };
  globalThis.document = { activeElement: null, visibilityState: "visible" };

  const root = {
    matches: () => false,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };

  try {
    const card = createAutoCycleCard({
      root,
      slide: {},
      views: ["first", "second", "third"],
      render: (view) => rendered.push(view),
      isPaused: () => dialogOpen,
    });

    assert.deepEqual(rendered, ["first"]);
    tick();
    assert.deepEqual(rendered, ["first", "second"]);

    listeners.get("pointerenter")();
    tick();
    assert.deepEqual(rendered, ["first", "second"]);

    listeners.get("pointerleave")();
    dialogOpen = true;
    tick();
    assert.deepEqual(rendered, ["first", "second"]);

    dialogOpen = false;
    tick();
    assert.deepEqual(rendered, ["first", "second", "third"]);
    assert.equal(card.index, 2);

    card.destroy();
    assert.equal(cleared, true);
    assert.equal(listeners.size, 0);
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});
