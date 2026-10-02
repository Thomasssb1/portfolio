import { drawArrow } from "./sketch-arrow.js";

export function setupCaseStudyArrow(section) {
  const heading = section?.querySelector(".case-study-heading h4");
  const firstPoint = section?.querySelector(".case-study-engineering strong");
  const svg = section?.querySelector("[data-case-study-arrow]");
  if (!heading || !firstPoint || !svg) return;

  function positionArrow() {
    if (window.matchMedia("(max-width: 900px)").matches) return;

    const bounds = section.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    const pointRect = firstPoint.getBoundingClientRect();
    const start = {
      x: headingRect.left - bounds.left + headingRect.width * 0.38,
      y: headingRect.top - bounds.top - 12,
    };
    const end = {
      x: pointRect.left - bounds.left - 25,
      y: pointRect.top - bounds.top + pointRect.height * 0.8,
    };
    const span = end.x - start.x;
    const arcTop = Math.max(12, Math.min(start.y - 92, end.y - 55));
    drawArrow(
      svg,
      bounds,
      start,
      { x: start.x - 10, y: arcTop },
      { x: end.x - span * 0.4, y: arcTop },
      end,
    );
  }

  const observer = new ResizeObserver(positionArrow);
  for (const element of [section, heading, firstPoint])
    observer.observe(element);
  document.fonts?.ready.then(positionArrow);
  positionArrow();
}
