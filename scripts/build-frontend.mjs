import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "frontend");
const destination = path.join(root, ".pages-dist");

export async function buildFrontend({
  sourceDirectory = source,
  outputDirectory = destination,
  assetBaseUrl = "https://assets.thomasbeer.uk",
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
  const html = await readFile(indexPath, "utf8");
  await writeFile(indexPath, html.replaceAll("./assets/", `${base}/`));
  return outputDirectory;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const output = await buildFrontend({
    assetBaseUrl: process.env.ASSET_CDN_BASE_URL,
  });
  console.log(`Built Pages frontend in ${output}`);
}
