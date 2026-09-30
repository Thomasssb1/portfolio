export const redditVideoRelease = "v1.1.0";

export const redditVideoExamples = Object.freeze([
  "example-1",
  "example-2",
  "example-3-1",
  "example-3-2",
  "example-3-3",
  "example-4",
  "example-5",
]);

export const redditVideoKeyPrefix = `reddit-videos/${redditVideoRelease}`;

export function redditVideoUrl(name, hostname = globalThis.location?.hostname) {
  if (!redditVideoExamples.includes(name)) {
    throw new Error(`Unknown Reddit video example: ${name}`);
  }

  if (
    hostname &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    !hostname.endsWith(".pages.dev")
  ) {
    return `https://assets.${hostname}/${redditVideoKeyPrefix}/${name}.mp4`;
  }

  return `https://github.com/Thomasssb1/reddit-2-video/releases/download/${redditVideoRelease}/${name}.mp4`;
}
