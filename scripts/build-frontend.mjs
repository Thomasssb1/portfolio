import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "frontend");
const destination = path.join(root, ".pages-dist");
const deployPreview =
  /<!-- deploy-preview:start -->[\s\S]*?<!-- deploy-preview:end -->/;

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

  return `<a class="site-footer-deploy" href="/go/portfolio-deployments" target="_blank" rel="noopener noreferrer"><span class="site-footer-deploy-dot" aria-hidden="true"></span><span class="site-footer-deploy-label">Latest production deploy</span> <span aria-hidden="true">·</span> <time datetime="${timestamp}">${label}</time></a>`;
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
  if (html.includes('href="./styles.css"')) {
    const css = await readFile(path.join(outputDirectory, "styles.css"));
    const hash = createHash("sha256").update(css).digest("hex").slice(0, 12);
    const filename = `styles.${hash}.css`;
    await writeFile(path.join(outputDirectory, filename), css);
    html = html.replaceAll('href="./styles.css"', `href="./${filename}"`);
  }
  if (productionBuildTime !== null) {
    if (!deployPreview.test(html)) {
      throw new Error("Deploy preview placeholder is missing");
    }
    html = html.replace(
      deployPreview,
      productionDeployMarkup(productionBuildTime),
    );
    html = html.replace(" data-github-activity-preview", "");
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
