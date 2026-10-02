const activity = document.querySelector("[data-github-activity]");
const link = activity?.querySelector("[data-github-activity-link]");

if (activity && link) {
  fetch("/api/github-activity")
    .then((response) => {
      if (!response.ok) throw new Error("GitHub activity is unavailable");
      return response.json();
    })
    .then(({ weeks }) => {
      if (!Array.isArray(weeks) || weeks.length === 0) return;

      const recentWeeks = weeks.slice(-52);
      const highestCount = Math.max(
        1,
        ...recentWeeks.map((week) => week.count),
      );
      const dateFormat = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      const bars = document.createDocumentFragment();

      for (const week of recentWeeks) {
        const share = Math.sqrt(week.count / highestCount);
        const bar = document.createElement("span");
        bar.className = "github-activity-week";
        bar.style.setProperty(
          "--activity-height",
          `${week.count === 0 ? 3 : Math.round(5 + share * 21)}px`,
        );
        bar.style.setProperty(
          "--activity-opacity",
          String(week.count === 0 ? 0.2 : 0.4 + share * 0.6),
        );
        bar.title = `Week of ${dateFormat.format(new Date(`${week.start}T00:00:00Z`))} · ${week.count} ${week.count === 1 ? "contribution" : "contributions"}`;
        bars.append(bar);
      }

      link.replaceChildren(bars);
      const total = recentWeeks.reduce((sum, week) => sum + week.count, 0);
      link.setAttribute(
        "aria-label",
        `GitHub activity: ${total} contributions over the past year. Open my GitHub profile`,
      );
      activity.hidden = false;
    })
    .catch(() => {
      // Keep the strip hidden until live activity is available.
    });
}
