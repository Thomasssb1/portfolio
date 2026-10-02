const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const GITHUB_USER = "Thomasssb1";
const CACHE_SECONDS = 60 * 60;
const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          firstDay
          contributionDays { date weekday contributionCount }
        }
      }
    }
  }
}`;

function calendarWeeks(data) {
  const weeks =
    data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks)) throw new Error("Missing contribution calendar");

  return weeks.slice(-52).map((week) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(week.firstDay) ||
      !Array.isArray(week.contributionDays) ||
      week.contributionDays.some(
        (day) =>
          !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
          !Number.isInteger(day.weekday) ||
          day.weekday < 0 ||
          day.weekday > 6 ||
          !Number.isSafeInteger(day.contributionCount) ||
          day.contributionCount < 0,
      )
    ) {
      throw new Error("Invalid contribution calendar");
    }

    const days = week.contributionDays.map((day) => ({
      date: day.date,
      weekday: day.weekday,
      count: day.contributionCount,
    }));
    return {
      start: week.firstDay,
      count: days.reduce((total, day) => total + day.count, 0),
      days,
    };
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  if (!env.GITHUB_ACTIVITY_TOKEN) {
    return new Response("GitHub activity unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(
    new URL("/api/github-activity?v=2", request.url),
  );
  const cached = await cache?.match(cacheKey).catch(() => undefined);
  if (cached) return cached;

  try {
    const githubResponse = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_ACTIVITY_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "thomasbeer-portfolio",
      },
      body: JSON.stringify({ query, variables: { login: GITHUB_USER } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!githubResponse.ok) throw new Error("GitHub request failed");

    const data = await githubResponse.json();
    if (data.errors?.length) throw new Error("GitHub GraphQL error");
    const response = Response.json(
      { weeks: calendarWeeks(data) },
      { headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` } },
    );
    if (cache) await cache.put(cacheKey, response.clone()).catch(() => {});
    return response;
  } catch {
    return new Response("GitHub activity unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
