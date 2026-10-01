export function setupCaseStudyArrow(section) {
  const heading = section?.querySelector(".case-study-heading h4");
  const firstPoint = section?.querySelector(".case-study-engineering strong");
  const svg = section?.querySelector("[data-case-study-arrow]");
  const curve = svg?.querySelector(".case-study-arrow-curve");
  const head = svg?.querySelector(".case-study-arrow-head");
  if (!heading || !firstPoint || !svg || !curve || !head) return;

  function positionArrow() {
    if (window.matchMedia("(max-width: 900px)").matches) return;

    const sectionRect = section.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    const pointRect = firstPoint.getBoundingClientRect();
    const startX =
      headingRect.left - sectionRect.left + headingRect.width * 0.38;
    const startY = headingRect.top - sectionRect.top - 12;
    const endX = pointRect.left - sectionRect.left - 25;
    const endY = pointRect.top - sectionRect.top + pointRect.height * 0.8;
    const peakY = Math.max(10, Math.min(startY - 70, endY - 32));
    const span = endX - startX;
    const round = (value) => Math.round(value * 10) / 10;

    svg.setAttribute(
      "viewBox",
      `0 0 ${sectionRect.width} ${sectionRect.height}`,
    );
    curve.setAttribute(
      "d",
      `M ${round(startX)} ${round(startY)} ` +
        `C ${round(startX - 4)} ${round(peakY + 34)}, ${round(startX + span * 0.11)} ${round(peakY + 8)}, ${round(startX + span * 0.27)} ${round(peakY)} ` +
        `C ${round(startX + span * 0.43)} ${round(peakY - 7)}, ${round(startX + span * 0.58)} ${round(peakY - 8)}, ${round(startX + span * 0.7)} ${round(peakY + 8)} ` +
        `C ${round(endX - 55)} ${round(peakY + 21)}, ${round(endX - 13)} ${round(endY - 18)}, ${round(endX)} ${round(endY)}`,
    );
    // Rounded, slightly uneven arrowhead inspired by SVG Arrows' simple style.
    head.setAttribute(
      "d",
      `M ${round(endX)} ${round(endY)} Q ${round(endX - 11)} ${round(endY + 1)} ${round(endX - 21)} ${round(endY - 2)} ` +
        `M ${round(endX)} ${round(endY)} Q ${round(endX + 2)} ${round(endY - 9)} ${round(endX - 4)} ${round(endY - 20)}`,
    );
  }

  new ResizeObserver(positionArrow).observe(section);
  document.fonts?.ready.then(positionArrow);
  positionArrow();
}
