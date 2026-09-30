export const videoRelease = "v1.1.0";

export const videoExamples = Object.freeze([
  "example-1",
  "example-2",
  "example-3-1",
  "example-3-2",
  "example-3-3",
  "example-4",
  "example-5",
]);

export const videoKeyPrefix = `reddit-videos/${videoRelease}`;

export function videoUrl(name, hostname = globalThis.location?.hostname) {
  if (!videoExamples.includes(name)) {
    throw new Error(`Unknown video example: ${name}`);
  }

  if (
    hostname &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    !hostname.endsWith(".pages.dev")
  ) {
    return `https://assets.${hostname}/${videoKeyPrefix}/${name}.mp4`;
  }

  return `https://github.com/Thomasssb1/reddit-2-video/releases/download/${videoRelease}/${name}.mp4`;
}
