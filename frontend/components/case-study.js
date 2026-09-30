import { analyticsPeriod, funnels, loadTime } from "./analytics-data.js";
import {
  renderFunnelChart,
  renderFunnelPreviewChart,
  renderLoadTimeBarChart,
  renderP99TrendChart,
  renderP99TrendPreviewChart,
  renderStatCards,
  renderWorkPanel,
} from "./analytics-components.js";
import { createAutoCycleCard } from "./auto-cycle-card.js";
import { setupCaseStudyArrow } from "./case-study-arrow.js";
import { setupCaseStudyVideoPlayer } from "./case-study-video-player.js";

setupCaseStudyArrow(document.querySelector("#avatar-outfit-shop-story"));
setupCaseStudyVideoPlayer(
  document.querySelector("[data-case-study-video-frame]"),
);

for (const image of document.querySelectorAll("[data-case-study-image]")) {
  const showImage = () =>
    image.closest("[data-case-study-image-frame]")?.classList.add("has-media");

  image.addEventListener("load", showImage, { once: true });
  if (image.complete && image.naturalWidth > 0) showImage();
}

const analyticsDialog = document.querySelector("[data-analytics-dialog]");
const analyticsOpen = document.querySelector("[data-analytics-open]");
const analyticsClose = document.querySelector("[data-analytics-close]");
const analyticsNext = document.querySelector("[data-analytics-next]");
const analyticsTitle = document.querySelector("[data-analytics-view-title]");
const analyticsPeriodLabel = document.querySelector("[data-analytics-period]");
const analyticsCount = document.querySelector("[data-analytics-count]");
const analyticsContent = document.querySelector("[data-analytics-content]");
const previewTitle = document.querySelector("[data-analytics-preview-title]");
const previewPeriod = document.querySelector(".analytics-preview-period");
const previewChart = document.querySelector("[data-analytics-preview-chart]");
const previewSlide = document.querySelector("[data-analytics-preview-slide]");
const previewCount = document.querySelector("[data-analytics-preview-count]");
const previewNote = document.querySelector("[data-analytics-preview-note]");
const analyticsViews = [{ id: "load-time", title: loadTime.title }, ...funnels];

function renderFunnel(funnel) {
  const first = funnel.steps[0].users;
  const last = funnel.steps.at(-1).users;
  const afterConversion = funnel.steps
    .slice(1)
    .reduce((conversion, step) => conversion * step.afterCompletion, 1);
  const drops = funnel.steps.slice(1).map((step, index) => ({
    step,
    index: index + 1,
    churn: 1 - step.users / funnel.steps[index].users,
  }));
  const biggestDrop = drops.reduce((largest, drop) =>
    drop.churn > largest.churn ? drop : largest,
  );
  analyticsContent.innerHTML = `
    ${renderStatCards([
      {
        label: "Total users",
        value: first.toLocaleString(),
        detail: "Before export",
      },
      {
        label: "Total conversion",
        value: `${((100 * last) / first).toFixed(2)}%`,
        detail: `≈${(100 * afterConversion).toFixed(2)}% after`,
      },
      {
        label: "Biggest drop",
        value: `${biggestDrop.index + 1}. ${biggestDrop.step.label}`,
        detail: `${(100 * biggestDrop.churn).toFixed(2)}% left before`,
        wide: true,
      },
    ])}
    ${renderFunnelChart(funnel)}
    ${renderWorkPanel(funnel.workTitle, funnel.work)}
    <p class="analytics-note">Before: ${funnel.source}${funnel.id === "basket" ? " and purchaseattemptempty.csv" : ""}, ${analyticsPeriod}. After rates are approximate recollections with no post-change export; end-to-end after conversion is calculated from those step rates. Purchase or checkout initiation is not a completed sale.</p>
  `;
}

function renderLoadTime() {
  analyticsContent.innerHTML = `
    ${renderLoadTimeBarChart(loadTime, analyticsPeriod)}
    ${renderP99TrendChart(loadTime.p99Stages)}
    ${renderWorkPanel("What I changed", "Tracking UI load time exposed the slow tail, so I moved from live catalog API requests to caching. Caching cut p99 by about 20% from the original, but the slowest loads were still noticeable. I then bundled the assets into the game so clients could load them locally. That cut p99 by about 70% from the original, at the cost of more server memory.")}
    <p class="analytics-note">The bar chart comes from uiloadtime.csv, ${analyticsPeriod}. Median, p95 and p99 are estimates from the timing breakdown; the export has no per-cell frequencies or official percentiles. The highest value is outlined. The line shows the reported 20% and 70% p99 reductions relative to live API loading. The export does not contain separate measurements for each delivery approach.</p>
  `;
}

function renderPreview(view, index, total) {
  previewTitle.textContent = view.title;
  previewPeriod.textContent =
    view.id === "load-time"
      ? "P99 change · 15–21 Mar 2026 export"
      : "Before: 15–21 Mar 2026";
  previewCount.textContent = `${index + 1} / ${total}`;
  analyticsOpen.setAttribute("aria-label", `Open analytics: ${view.title}`);

  if (view.id === "load-time") {
    previewNote.textContent = "P99 · 70% lower";
    previewChart.innerHTML = renderP99TrendPreviewChart(loadTime.p99Stages);
  } else {
    previewNote.textContent = "Outline ≈ after";
    previewChart.innerHTML = renderFunnelPreviewChart(view);
  }
}

if (
  analyticsDialog &&
  analyticsOpen &&
  analyticsClose &&
  analyticsNext &&
  analyticsTitle &&
  analyticsPeriodLabel &&
  analyticsCount &&
  analyticsContent &&
  previewTitle &&
  previewPeriod &&
  previewChart &&
  previewSlide &&
  previewCount &&
  previewNote
) {
  let activeIndex = 0;
  const previewCarousel = createAutoCycleCard({
    root: analyticsOpen,
    slide: previewSlide,
    views: analyticsViews,
    render: renderPreview,
    isPaused: () => analyticsDialog.open,
  });

  function showAnalyticsView(index) {
    activeIndex = index;
    const view = analyticsViews[index];
    analyticsTitle.textContent = view.title;
    analyticsPeriodLabel.textContent =
      view.id === "load-time"
        ? `P99 change · ${analyticsPeriod} timing export`
        : `Before: ${analyticsPeriod}`;
    analyticsCount.textContent = `${index + 1} / ${analyticsViews.length}`;
    analyticsNext.setAttribute(
      "aria-label",
      `Next: ${analyticsViews[(index + 1) % analyticsViews.length].title}`,
    );
    if (view.id === "load-time") renderLoadTime();
    else renderFunnel(view);
    analyticsDialog.scrollTop = 0;
  }

  analyticsOpen.addEventListener("click", () => {
    showAnalyticsView(previewCarousel.index);
    analyticsDialog.showModal();
    analyticsClose.focus();
  });
  analyticsNext.addEventListener("click", () => {
    showAnalyticsView((activeIndex + 1) % analyticsViews.length);
  });
  analyticsClose.addEventListener("click", () => analyticsDialog.close());
  analyticsDialog.addEventListener("click", (event) => {
    if (event.target === analyticsDialog) analyticsDialog.close();
  });
}
