const video = document.querySelector("[data-roblox-video]");
const videoFrame = document.querySelector("[data-roblox-video-frame]");
const poster = document.querySelector("[data-roblox-poster]");

if (poster && videoFrame) {
  const showPoster = () => videoFrame.classList.add("has-poster");
  poster.addEventListener("load", showPoster, { once: true });
  if (poster.complete && poster.naturalWidth > 0) showPoster();
}

if (video && videoFrame) {
  const showVideo = () => {
    videoFrame.classList.add("has-media");
    video.inert = false;
  };
  video.addEventListener("loadedmetadata", showVideo, { once: true });
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) showVideo();
}

for (const image of document.querySelectorAll("[data-roblox-image]")) {
  const showImage = () =>
    image.closest("[data-roblox-image-frame]")?.classList.add("has-media");

  image.addEventListener("load", showImage, { once: true });
  if (image.complete && image.naturalWidth > 0) showImage();
}
