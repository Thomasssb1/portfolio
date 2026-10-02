import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "frontend");
const destination = path.join(root, ".pages-dist");
const deployMarker = "<!-- production-deploy -->";

function productionDeployMarkup(buildTime) {
  const date = new Date(buildTime);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Production build time must be a valid date");
  }

  const timestamp = date.toISOString();
  const label = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/London",
    timeZoneName: "short",
  }).format(date);

  return `<p class="site-footer-deploy"><span class="site-footer-deploy-dot" aria-hidden="true"></span><span class="site-footer-deploy-label">Latest production deploy</span> <span aria-hidden="true">·</span> <time datetime="${timestamp}">${label}</time></p>`;
}

export async function buildFrontend({
  sourceDirectory = source,
  outputDirectory = destination,
  assetBaseUrl = "https://assets.thomasbeer.uk",
  productionBuildTime = null,
} = {}) {
  const base = assetBaseUrl.replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+$/.test(base)) {
    throw new Error("ASSET_CDN_BASE_URL must be an HTTPS origin");
  }

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await cp(sourceDirectory, outputDirectory, {
    recursive: true,
    filter: (entry) =>
      path.resolve(entry) !== path.join(sourceDirectory, "assets"),
  });

  const indexPath = path.join(outputDirectory, "index.html");
  let html = await readFile(indexPath, "utf8");
  html = html.replaceAll("./assets/", `${base}/`);
  if (productionBuildTime !== null) {
    const hiddenMeta = '<div class="site-footer-meta" hidden>';
    if (!html.includes(hiddenMeta) || !html.includes(deployMarker)) {
      throw new Error("Production deploy placeholder is missing");
    }
    html = html
      .replace(hiddenMeta, '<div class="site-footer-meta">')
      .replace(deployMarker, productionDeployMarkup(productionBuildTime));
  }
  await writeFile(indexPath, html);
  return outputDirectory;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const output = await buildFrontend({
    assetBaseUrl: process.env.ASSET_CDN_BASE_URL,
    productionBuildTime:
      process.env.PORTFOLIO_PRODUCTION_BUILD === "true" ? new Date() : null,
  });
  console.log(`Built Pages frontend in ${output}`);
}
