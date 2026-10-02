const round = (value) => Math.round(value * 10) / 10;

export function drawArrow(
  svg,
  bounds,
  start,
  firstControl,
  secondControl,
  end,
) {
  if (!bounds.width || !bounds.height) return;

  svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
  svg
    .querySelector("[data-arrow-curve]")
    .setAttribute(
      "d",
      `M ${round(start.x)} ${round(start.y)} ` +
        `C ${round(firstControl.x)} ${round(firstControl.y)}, ` +
        `${round(secondControl.x)} ${round(secondControl.y)}, ` +
        `${round(end.x)} ${round(end.y)}`,
    );

  const dx = end.x - secondControl.x;
  const dy = end.y - secondControl.y;
  const length = Math.hypot(dx, dy) || 1;
  const alongX = dx / length;
  const alongY = dy / length;
  const sideX = -alongY;
  const sideY = alongX;
  const backX = end.x - alongX * 19;
  const backY = end.y - alongY * 19;
  const left = { x: backX + sideX * 8, y: backY + sideY * 8 };
  const right = { x: backX - sideX * 8, y: backY - sideY * 8 };
  svg
    .querySelector("[data-arrow-head]")
    .setAttribute(
      "d",
      `M ${round(left.x)} ${round(left.y)} ` +
        `Q ${round(backX + sideX * 2)} ${round(backY + sideY * 2)} ${round(end.x)} ${round(end.y)} ` +
        `Q ${round(backX - sideX * 2)} ${round(backY - sideY * 2)} ${round(right.x)} ${round(right.y)}`,
    );
}
