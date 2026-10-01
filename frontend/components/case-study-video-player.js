function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.floor(Math.max(0, seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

export function setupCaseStudyVideoPlayer(frame) {
  if (!frame) return;

  const video = frame.querySelector("video");
  const ui = frame.querySelector("[data-video-ui]");
  const toggles = [...frame.querySelectorAll("[data-video-toggle]")];
  const mainButton = frame.querySelector(".case-study-player-main");
  const mainLabel = frame.querySelector("[data-video-main-label]");
  const seek = frame.querySelector("[data-video-seek]");
  const time = frame.querySelector("[data-video-time]");
  const mute = frame.querySelector("[data-video-mute]");
  const fullscreen = frame.querySelector("[data-video-fullscreen]");

  if (
    !video ||
    !ui ||
    toggles.length !== 2 ||
    !mainButton ||
    !mainLabel ||
    !seek ||
    !time ||
    !mute ||
    !fullscreen
  )
    return;

  const source = video.querySelector?.("source[data-src]");
  let sourceObserver;
  function loadVideo() {
    if (!source?.dataset?.src) return;
    source.src = source.dataset.src;
    delete source.dataset.src;
    video.preload = "metadata";
    video.load();
    sourceObserver?.disconnect();
  }
  if (source?.dataset?.src) {
    if (typeof IntersectionObserver === "function") {
      sourceObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadVideo();
        },
        { rootMargin: "400px" },
      );
      sourceObserver.observe(frame);
    } else {
      loadVideo();
    }
  }

  const duration = () =>
    Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  let scrubPreview = null;
  let pendingSeek = null;
  let localVideoUrl = null;
  let loadingLocalCopy = false;

  async function loadLocalCopyForSeek() {
    if (loadingLocalCopy || localVideoUrl) return;
    loadingLocalCopy = true;
    const wasPlaying = !video.paused;

    try {
      const source = video.currentSrc || video.querySelector("source")?.src;
      if (!source) throw new Error("Gameplay video source is missing");
      const response = await fetch(source);
      if (!response.ok) throw new Error("Unable to load gameplay video");
      localVideoUrl = URL.createObjectURL(await response.blob());
      await new Promise((resolve, reject) => {
        const cleanup = () => {
          video.removeEventListener("loadedmetadata", onMetadata);
          video.removeEventListener("error", onError);
        };
        const onMetadata = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("Unable to open gameplay video"));
        };
        video.addEventListener("loadedmetadata", onMetadata);
        video.addEventListener("error", onError);
        video.src = localVideoUrl;
        video.load();
      });
      if (pendingSeek !== null) video.currentTime = pendingSeek;
      if (wasPlaying) await video.play();
    } catch {
      pendingSeek = null;
      fallBackToNativeControls();
    } finally {
      loadingLocalCopy = false;
    }
  }

  function showTime(current, total) {
    const progress = total ? Math.min((current / total) * 100, 100) : 0;
    time.textContent = `${formatTime(current)} / ${formatTime(total)}`;
    seek.value = String(progress);
    seek.style.setProperty("--progress", `${progress}%`);
    seek.setAttribute(
      "aria-valuetext",
      `${formatTime(current)} of ${formatTime(total)}`,
    );
  }

  function updateTime() {
    const total = duration();
    seek.disabled = !total;
    showTime(scrubPreview ?? pendingSeek ?? video.currentTime, total);
  }

  function updatePlayback() {
    const playing = !video.paused && !video.ended;
    frame.classList.toggle("is-playing", playing);
    mainButton.hidden = playing;
    mainLabel.textContent =
      video.currentTime > 0 && !video.ended
        ? "Resume gameplay"
        : "Watch gameplay";
    for (const button of toggles) {
      button.setAttribute(
        "aria-label",
        playing ? "Pause gameplay video" : "Play gameplay video",
      );
    }
  }

  function updateMute() {
    const muted = video.muted || video.volume === 0;
    frame.classList.toggle("is-muted", muted);
    mute.setAttribute(
      "aria-label",
      muted ? "Unmute gameplay video" : "Mute gameplay video",
    );
    mute.setAttribute("aria-pressed", String(muted));
  }

  function fallBackToNativeControls() {
    frame.classList.remove("has-custom-player");
    video.controls = true;
  }

  function togglePlayback() {
    if (!video.paused && !video.ended) {
      video.pause();
      return;
    }
    if (video.ended) video.currentTime = 0;
    loadVideo();
    try {
      video.play()?.catch((error) => {
        if (error?.name !== "AbortError") fallBackToNativeControls();
      });
    } catch {
      fallBackToNativeControls();
    }
  }

  for (const button of toggles) {
    button.addEventListener("click", togglePlayback);
  }
  video.addEventListener("click", () => {
    if (frame.classList.contains("has-custom-player")) togglePlayback();
  });
  seek.addEventListener("input", () => {
    const total = duration();
    if (!total) return;
    scrubPreview = (Number(seek.value) / 100) * total;
    showTime(scrubPreview, total);
  });
  seek.addEventListener("change", () => {
    const total = duration();
    if (!total) return;
    pendingSeek = (Number(seek.value) / 100) * total;
    scrubPreview = null;
    video.currentTime = pendingSeek;
    updateTime();
    updatePlayback();
  });
  mute.addEventListener("click", () => {
    video.muted = !video.muted;
  });

  if (frame.requestFullscreen && document.exitFullscreen) {
    fullscreen.addEventListener("click", () => {
      if (document.fullscreenElement === frame) {
        document.exitFullscreen()?.catch(() => {});
      } else {
        frame.requestFullscreen()?.catch(() => {});
      }
    });
    document.addEventListener("fullscreenchange", () => {
      fullscreen.setAttribute(
        "aria-label",
        document.fullscreenElement === frame
          ? "Exit fullscreen"
          : "Enter fullscreen",
      );
    });
  } else {
    fullscreen.hidden = true;
  }

  video.addEventListener("loadedmetadata", updateTime);
  video.addEventListener("durationchange", updateTime);
  video.addEventListener("timeupdate", updateTime);
  video.addEventListener("seeked", () => {
    if (
      pendingSeek !== null &&
      Math.abs(video.currentTime - pendingSeek) > 0.5
    ) {
      void loadLocalCopyForSeek();
      return;
    }
    pendingSeek = null;
    updateTime();
  });
  video.addEventListener("play", updatePlayback);
  video.addEventListener("pause", updatePlayback);
  video.addEventListener("ended", updatePlayback);
  video.addEventListener("volumechange", updateMute);
  video.addEventListener("error", fallBackToNativeControls);

  video.controls = false;
  frame.classList.add("has-custom-player");
  updateTime();
  updatePlayback();
  updateMute();
}
