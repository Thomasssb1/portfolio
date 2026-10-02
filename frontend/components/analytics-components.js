const percent = (value) => `${(value * 100).toFixed(2)}%`;
const bar = (value) => `${(Math.max(0, Math.min(value, 1)) * 100).toFixed(2)}%`;

export function renderStatCards(cards) {
  return `<div class="analytics-kpis">${cards
    .map(
      ({ label, value, detail = "", wide = false }) =>
        `<p${wide ? ' class="analytics-kpi-wide"' : ""}><span>${label}</span><strong>${value}</strong><small>${detail}</small></p>`,
    )
    .join("")}</div>`;
}

export function renderWorkPanel(title, body) {
  return `<div class="analytics-work"><h4>${title}</h4><p>${body}</p></div>`;
}

function renderFunnelMetric(before, after, kind, hasAfter) {
  return `<div class="analytics-comparison analytics-comparison--${kind}" style="--before: ${bar(before)}; --after: ${bar(after)}" role="img" aria-label="Before ${percent(before)}${hasAfter ? `; approximate after ${percent(after)}` : ""}">
    <span class="analytics-comparison-before" aria-hidden="true"></span>
    ${hasAfter ? '<span class="analytics-comparison-after" aria-hidden="true"></span>' : ""}
    <span class="analytics-comparison-values" aria-hidden="true"><span>${percent(before)}</span>${hasAfter ? `<strong>≈${percent(after)}</strong>` : ""}</span>
  </div>`;
}

export function renderFunnelChart(funnel) {
  const first = funnel.steps[0].users;
  let afterTotal = 1;

  return `<div class="analytics-legend" aria-label="Funnel comparison legend"><span><i class="analytics-legend-solid"></i>Before</span><span><i class="analytics-legend-outline"></i>After</span></div>
    <p class="analytics-table-hint">Scroll the table to see every column →</p>
    <div class="analytics-table-wrap" role="region" aria-label="${funnel.title} table" tabindex="0">
      <table class="analytics-table">
        <thead><tr><th scope="col">Step</th><th scope="col">Total users</th><th scope="col">Step completion</th><th scope="col">Churn</th><th scope="col">Total conversion</th></tr></thead>
        <tbody>
          ${funnel.steps
            .map((step, index) => {
              const completion =
                index === 0 ? 1 : step.users / funnel.steps[index - 1].users;
              const churn = index === 0 ? 0 : 1 - completion;
              const total = step.users / first;
              const afterCompletion = index === 0 ? 1 : step.afterCompletion;
              afterTotal *= afterCompletion;
              return `<tr>
                <th scope="row">${index + 1}. ${step.label}</th>
                <td class="analytics-user-count">${step.users.toLocaleString()}</td>
                <td class="analytics-value">${renderFunnelMetric(completion, afterCompletion, "complete", index > 0)}</td>
                <td class="analytics-value">${renderFunnelMetric(churn, 1 - afterCompletion, "churn", index > 0)}</td>
                <td class="analytics-value">${renderFunnelMetric(total, afterTotal, "total", index > 0)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

export function renderFunnelPreviewChart(funnel) {
  const first = funnel.steps[0].users;
  let afterTotal = 1;

  return funnel.steps
    .map((step, index) => {
      afterTotal *= index === 0 ? 1 : step.afterCompletion;
      return `<span class="analytics-preview-bar"><span class="analytics-preview-bar-fill" style="width: ${bar(step.users / first)}"></span>${index === 0 ? "" : `<span class="analytics-preview-after" style="--after: ${bar(afterTotal)}" aria-hidden="true"></span>`}<span>${step.label}</span><strong>${step.users}</strong></span>`;
    })
    .join("");
}

export function renderLoadTimeBarChart(loadTime, period) {
  const axisMax = Math.max(45, Math.ceil(loadTime.max / 45) * 45);
  const markers = [
    { label: "Median", value: loadTime.median, kind: "median" },
    { label: "P95", value: loadTime.p95, kind: "p95" },
    { label: "P99", value: loadTime.p99, kind: "p99" },
    { label: "Highest exported", value: loadTime.max, kind: "maximum" },
  ];
  const afterStages = loadTime.p99Stages.slice(1);

  return `<h4 class="analytics-latency-heading">UI load times (seconds)</h4>
    <div class="analytics-latency-graph" role="group" aria-label="Live API load times before fixes and approximate p99 after fixes, in seconds">
      <p class="analytics-latency-stage-label">Before fixes · Live API (${period} export)</p>
      <div class="analytics-latency-axis">${Array.from({ length: 5 }, (_, index) => `<span>${((axisMax * index) / 4).toFixed(0)}s</span>`).join("")}</div>
      ${markers
        .map(
          ({ label, value, kind }) => `
            <div class="analytics-latency-row">
              <span class="analytics-latency-label">${label}</span>
              <div class="analytics-latency-track"><span class="analytics-latency-bar analytics-latency-bar--${kind}" style="width: ${((value / axisMax) * 100).toFixed(2)}%"></span></div>
              <strong>${kind === "p99" ? "≈" : ""}${value.toFixed(1)}s</strong>
            </div>`,
        )
        .join("")}
      <p class="analytics-latency-stage-label analytics-latency-stage-label--after">After fixes · Approximate p99 from reductions below</p>
      ${afterStages
        .map(
          ({ label, relative }) => `
            <div class="analytics-latency-row">
              <span class="analytics-latency-label">${label}</span>
              <div class="analytics-latency-track"><span class="analytics-latency-bar analytics-latency-bar--estimate" style="width: ${(((loadTime.p99 * relative) / axisMax) * 100).toFixed(2)}%"></span></div>
              <strong>≈${(loadTime.p99 * relative).toFixed(1)}s</strong>
            </div>`,
        )
        .join("")}
    </div>`;
}

function renderP99TrendSvg(stages, compact = false) {
  const width = compact ? 320 : 640;
  const height = compact ? 56 : 120;
  const left = compact ? 53 : 106;
  const right = compact ? 267 : 534;
  const gridLeft = compact ? 17 : 58;
  const gridRight = compact ? 303 : 610;
  const top = compact ? 6 : 14;
  const bottom = compact ? 49 : 103;
  const points = stages.map((stage, index) => ({
    x: left + ((right - left) * index) / Math.max(stages.length - 1, 1),
    y: bottom - stage.relative * (bottom - top),
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");

  return `<svg class="analytics-trend-svg${compact ? " analytics-trend-svg--preview" : ""}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
    ${[1, 0.5, 0]
      .map((level) => {
        const y = bottom - level * (bottom - top);
        return `<line class="analytics-trend-gridline" x1="${gridLeft}" y1="${y}" x2="${gridRight}" y2="${y}"></line>${compact ? "" : `<text class="analytics-trend-axis-label" x="7" y="${y + 4}">${Math.round(level * 100)}%</text>`}`;
      })
      .join("")}
    <polyline class="analytics-trend-line" points="${line}"></polyline>
    ${points
      .map(({ x, y }) => {
        const size = compact ? 7 : 9;
        return `<rect class="analytics-trend-point" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}"></rect>`;
      })
      .join("")}
  </svg>`;
}

export function renderP99TrendChart(stages) {
  return `<section class="analytics-trend-graph" aria-label="Reported p99 load time by asset delivery approach">
    <div class="analytics-trend-heading"><h4>P99 by asset delivery</h4><p>Relative to live API loading</p></div>
    ${renderP99TrendSvg(stages)}
    <div class="analytics-trend-stages">
      ${stages
        .map(
          (stage) =>
            `<div><span>${stage.label}</span><strong>${Math.round(stage.relative * 100)}%</strong><small>${stage.detail}</small></div>`,
        )
        .join("")}
    </div>
  </section>`;
}

export function renderP99TrendPreviewChart(stages) {
  return `<span class="analytics-preview-trend">${renderP99TrendSvg(stages, true)}<span class="analytics-preview-trend-stages">${stages.map((stage) => `<span><strong>${Math.round(stage.relative * 100)}%</strong><small>${stage.label}</small></span>`).join("")}</span></span>`;
}
