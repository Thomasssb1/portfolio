import { drawArrow } from "./sketch-arrow.js";

function watchLayout(elements, update) {
  const observer = new ResizeObserver(update);
  for (const element of elements) observer.observe(element);
  document.fonts?.ready.then(update);
  update();
}

const work = document.querySelector("#work");
const workHeading = work?.querySelector("#work-title");
const firstProjectTitle = work?.querySelector(
  ".featured-project .project-info h3",
);
const workArrow = work?.querySelector("[data-work-project-arrow]");

if (work && workHeading && firstProjectTitle && workArrow) {
  function positionWorkArrow() {
    if (window.matchMedia("(max-width: 900px)").matches) return;

    const bounds = work.getBoundingClientRect();
    const heading = workHeading.getBoundingClientRect();
    const title = firstProjectTitle.getBoundingClientRect();
    const headingText = document.createRange();
    headingText.selectNodeContents(workHeading);
    const firstLine = headingText.getClientRects()[0] ?? heading;
    const titleText = document.createRange();
    titleText.selectNodeContents(firstProjectTitle);
    const titleLine = titleText.getClientRects()[0] ?? title;
    const start = {
      x: firstLine.right - bounds.left + 12,
      y: firstLine.bottom - bounds.top + 10,
    };
    const end = {
      x: titleLine.left - bounds.left + titleLine.width * 0.5,
      y: title.top - bounds.top - 18,
    };
    drawArrow(
      workArrow,
      bounds,
      start,
      { x: Math.min(start.x + 230, bounds.width - 20), y: start.y - 20 },
      { x: Math.min(end.x + 145, bounds.width - 20), y: end.y - 145 },
      end,
    );
  }

  watchLayout([work, workHeading, firstProjectTitle], positionWorkArrow);
}

const demo = document.querySelector("[data-extension-demo]");
const project = demo?.closest(".extension-project");
const details = project?.querySelector(".extension-details");
const links = details?.querySelector(".project-links");
const invite = demo?.querySelector("[data-extension-invite]");
const tryArrow = project?.querySelector("[data-extension-try-arrow]");

if (demo && project && details && links && invite && tryArrow) {
  function positionTryArrow() {
    if (invite.hidden) return;

    const bounds = project.getBoundingClientRect();
    const detailsRect = details.getBoundingClientRect();
    const linksRect = links.getBoundingClientRect();
    const target = invite.getBoundingClientRect();
    const end = {
      x: target.left - bounds.left + target.width * 0.5,
      y: target.top - bounds.top - 10,
    };
    const linkEndX = detailsRect.right - bounds.left + 6;
    const wideArc = end.x - linkEndX > 110;
    const start = wideArc
      ? {
          x: linkEndX,
          y: linksRect.top - bounds.top + linksRect.height * 0.5,
        }
      : {
          x: linksRect.left - bounds.left + linksRect.width * 0.55,
          y: detailsRect.bottom - bounds.top + 6,
        };
    const span = end.x - start.x;
    const firstControl = wideArc
      ? { x: start.x + span * 0.32, y: start.y - 70 }
      : { x: start.x + span * 0.35, y: start.y + 22 };
    const secondControl = wideArc
      ? { x: end.x - span * 0.25, y: start.y - 70 }
      : { x: end.x - span * 0.2, y: end.y - 28 };
    drawArrow(tryArrow, bounds, start, firstControl, secondControl, end);
  }

  function syncTryArrow() {
    const isOpen = demo.dataset.open === "true";
    tryArrow.toggleAttribute("hidden", isOpen);
    if (!isOpen) requestAnimationFrame(positionTryArrow);
  }

  watchLayout([project, details, links, invite], positionTryArrow);
  new MutationObserver(syncTryArrow).observe(demo, {
    attributes: true,
    attributeFilter: ["data-open"],
  });
  syncTryArrow();
}
