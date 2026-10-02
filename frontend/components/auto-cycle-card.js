export function createAutoCycleCard({
  root,
  slide,
  views,
  render,
  isPaused = () => false,
  intervalMs = 4500,
}) {
  if (!root || !slide || views.length === 0) return null;

  let index = 0;
  let visible = true;
  let hovering = root.matches(":hover");
  let sliding = false;
  let destroyed = false;
  let revision = 0;
  let animation;
  let observer;
  let timer;

  const paused = () =>
    destroyed ||
    hovering ||
    document.activeElement === root ||
    !visible ||
    document.visibilityState !== "visible" ||
    isPaused();

  async function cycle() {
    if (sliding || paused()) return;
    sliding = true;
    const cycleRevision = revision;

    try {
      if (slide.animate) {
        const exit = slide.animate(
          [
            { transform: "translateX(0)", opacity: 1 },
            { transform: "translateX(-105%)", opacity: 0 },
          ],
          { duration: 350, easing: "ease-in", fill: "forwards" },
        );
        animation = exit;
        await exit.finished.catch(() => {});
        exit.cancel();
        if (animation === exit) animation = undefined;
      }

      if (cycleRevision !== revision || paused()) return;
      index = (index + 1) % views.length;
      render(views[index], index, views.length);

      if (slide.animate) {
        const enter = slide.animate(
          [
            { transform: "translateX(105%)", opacity: 0 },
            { transform: "translateX(0)", opacity: 1 },
          ],
          { duration: 420, easing: "ease-out", fill: "forwards" },
        );
        animation = enter;
        await enter.finished.catch(() => {});
        enter.cancel();
        if (animation === enter) animation = undefined;
      }
    } finally {
      sliding = false;
    }
  }

  const onPointerEnter = () => {
    hovering = true;
    animation?.cancel();
  };
  const onPointerLeave = () => {
    hovering = false;
  };

  root.addEventListener("pointerenter", onPointerEnter);
  root.addEventListener("pointerleave", onPointerLeave);
  render(views[index], index, views.length);

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(root);
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timer = window.setInterval(() => void cycle(), intervalMs);
  }

  return {
    get index() {
      return index;
    },
    setIndex(nextIndex) {
      if (
        destroyed ||
        !Number.isInteger(nextIndex) ||
        nextIndex < 0 ||
        nextIndex >= views.length
      ) {
        return;
      }

      revision += 1;
      animation?.cancel();
      animation = undefined;
      index = nextIndex;
      render(views[index], index, views.length);

      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = window.setInterval(() => void cycle(), intervalMs);
      }
    },
    destroy() {
      destroyed = true;
      animation?.cancel();
      if (timer !== undefined) window.clearInterval(timer);
      observer?.disconnect();
      root.removeEventListener("pointerenter", onPointerEnter);
      root.removeEventListener("pointerleave", onPointerLeave);
    },
  };
}
