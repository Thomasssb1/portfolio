const activity = document.querySelector("[data-github-activity]");
const link = activity?.querySelector("[data-github-activity-link]");

function sampleWeeks() {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const latestSunday = new Date(todayUtc);
  latestSunday.setUTCDate(latestSunday.getUTCDate() - today.getUTCDay());

  return Array.from({ length: 52 }, (_, index) => {
    const week = new Date(latestSunday);
    week.setUTCDate(week.getUTCDate() - (51 - index) * 7);
    const days = Array.from({ length: 7 }, (_, weekday) => {
      const day = new Date(week);
      day.setUTCDate(day.getUTCDate() + weekday);
      return {
        date: day.toISOString().slice(0, 10),
        weekday,
        count: (index + weekday) % 11 === 0 ? 0 : (index * 3 + weekday * 7) % 8,
      };
    }).filter((day) => Date.parse(`${day.date}T00:00:00Z`) <= todayUtc);

    return {
      start: week.toISOString().slice(0, 10),
      count: days.reduce((total, day) => total + day.count, 0),
      days,
    };
  });
}

function showWeeks(weeks, sample = false) {
  if (!Array.isArray(weeks) || weeks.length === 0) return;

  const recentWeeks = weeks.slice(-52);
  const highestCount = Math.max(
    1,
    ...recentWeeks.flatMap((week) => week.days.map((day) => day.count)),
  );
  const dateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const columns = document.createDocumentFragment();

  for (const week of recentWeeks) {
    const column = document.createElement("span");
    column.className = "github-activity-week";
    column.setAttribute("aria-hidden", "true");
    column.title = `${sample ? "Sample: " : ""}Week of ${dateFormat.format(new Date(`${week.start}T00:00:00Z`))} · ${week.count} ${week.count === 1 ? "contribution" : "contributions"}`;

    for (let weekday = 0; weekday < 7; weekday++) {
      const day = week.days.find((entry) => entry.weekday === weekday);
      const square = document.createElement("span");
      square.className = "github-activity-day";
      if (day) {
        const share = Math.sqrt(day.count / highestCount);
        square.style.setProperty(
          "--activity-opacity",
          String(day.count === 0 ? 0.18 : 0.35 + share * 0.65),
        );
        square.title = `${sample ? "Sample: " : ""}${dateFormat.format(new Date(`${day.date}T00:00:00Z`))} · ${day.count} ${day.count === 1 ? "contribution" : "contributions"}`;
      } else {
        square.classList.add("github-activity-day--missing");
      }
      column.append(square);
    }

    columns.append(column);
  }

  link.replaceChildren(columns);
  const total = recentWeeks.reduce((sum, week) => sum + week.count, 0);
  link.setAttribute(
    "aria-label",
    `${sample ? "Sample GitHub activity" : "GitHub activity"}: ${total} contributions over the past year. Open my GitHub profile`,
  );
  activity.hidden = false;
}

if (activity && link) {
  if (activity.hasAttribute("data-github-activity-preview")) {
    showWeeks(sampleWeeks(), true);
  }

  fetch("/api/github-activity?v=2")
    .then((response) => {
      if (!response.ok) throw new Error("GitHub activity is unavailable");
      return response.json();
    })
    .then(({ weeks }) => showWeeks(weeks))
    .catch(() => {
      // Keep mock activity in local previews and hide unavailable production data.
    });
}
