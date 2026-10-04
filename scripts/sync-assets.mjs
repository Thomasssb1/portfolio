import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDirectory = path.join(root, "frontend", "assets");
const mediaTypes = new Map([
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".ogg", "audio/ogg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
]);

async function* mediaFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* mediaFiles(filename);
    else if (
      entry.isFile() &&
      mediaTypes.has(path.extname(entry.name).toLowerCase())
    ) {
      yield filename;
    }
  }
}

async function sha256(filename) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

function awsCommand(args) {
  const result = spawnSync("aws", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}

function check(result, action) {
  if (result.status !== 0) {
    throw new Error(`${action}: ${result.stderr.trim() || "AWS CLI failed"}`);
  }
  return result.stdout;
}

export async function syncAssets({
  sourceDirectory = assetDirectory,
  bucket,
  endpoint,
  runAws = awsCommand,
} = {}) {
  if (!bucket || !/^https:\/\/[^/]+$/.test(endpoint ?? "")) {
    throw new Error("ASSET_R2_BUCKET and ASSET_R2_ENDPOINT are required");
  }

  const result = { uploaded: 0, skipped: 0 };
  const prefix = ["--endpoint-url", endpoint];
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "portfolio-r2-"));
  try {
    for await (const filename of mediaFiles(sourceDirectory)) {
      const key = path
        .relative(sourceDirectory, filename)
        .split(path.sep)
        .join("/");
      const { size } = await stat(filename);
      const digest = await sha256(filename);
      const headResult = runAws([
        "s3api",
        "head-object",
        ...prefix,
        "--bucket",
        bucket,
        "--key",
        key,
      ]);

      if (headResult.status === 0) {
        const remote = JSON.parse(headResult.stdout);
        if (
          remote.ContentLength === size &&
          remote.Metadata?.sha256 === digest
        ) {
          result.skipped++;
          console.log(`Unchanged ${key}`);
          continue;
        }

        // Objects uploaded before this script may have no checksum metadata.
        // Compare their contents instead of uploading an identical copy.
        if (remote.ContentLength === size && !remote.Metadata?.sha256) {
          const remoteFile = path.join(tempDirectory, "remote-object");
          check(
            runAws([
              "s3api",
              "get-object",
              ...prefix,
              "--bucket",
              bucket,
              "--key",
              key,
              remoteFile,
            ]),
            `Read ${key}`,
          );
          if ((await sha256(remoteFile)) === digest) {
            result.skipped++;
            console.log(`Unchanged ${key}`);
            continue;
          }
        }
      } else if (
        !/(\(404\)|\(NotFound\)|\(NoSuchKey\))/.test(headResult.stderr)
      ) {
        check(headResult, `Inspect ${key}`);
      }

      const contentType = mediaTypes.get(path.extname(filename).toLowerCase());
      check(
        runAws([
          "s3",
          "cp",
          filename,
          `s3://${bucket}/${key}`,
          ...prefix,
          "--content-type",
          contentType,
          "--cache-control",
          "public, max-age=0, must-revalidate",
          "--metadata",
          `sha256=${digest}`,
          "--no-progress",
        ]),
        `Upload ${key}`,
      );
      result.uploaded++;
      console.log(`Uploaded ${key}`);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
  return result;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = await syncAssets({
    bucket: process.env.ASSET_R2_BUCKET,
    endpoint: process.env.ASSET_R2_ENDPOINT,
  });
  console.log(`${result.uploaded} uploaded, ${result.skipped} unchanged`);
}
