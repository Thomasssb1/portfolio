import "./app-window/app-window.js";
import "./app-terminal/app-terminal.js";

const examples = {
  "example-1": {
    community: "r/AskReddit",
    command:
      "reddit-2-video --subreddit AskReddit --type comments --count 10 --alternate=on,on --title-color H0000FF --output example-1",
  },
  "example-2": {
    community: "r/nosleep",
    command:
      "reddit-2-video --subreddit nosleep --horror --post-confirmation --music assets/audio/ambient-horror.mp3 --youtube-short --output example-2.mp4",
  },
  "example-3-1": {
    community: "r/pettyrevenge",
    command:
      "reddit-2-video --subreddit pettyrevenge --repeat 3 --no-nsfw --censor --sort top --output example-3",
  },
  "example-3-2": {
    community: "r/pettyrevenge",
    command:
      "reddit-2-video --subreddit pettyrevenge --repeat 3 --no-nsfw --censor --sort top --output example-3",
  },
  "example-3-3": {
    community: "r/pettyrevenge",
    command:
      "reddit-2-video --subreddit pettyrevenge --repeat 3 --no-nsfw --censor --sort top --output example-3",
  },
  "example-4": {
    community: "r/dadjokes",
    command:
      "reddit-2-video --subreddit dadjokes --type multi --count 3 --sort rising --framerate 75 --output example-4.mp4",
  },
  "example-5": {
    community: "r/TrueOffMyChest",
    command:
      "reddit-2-video --subreddit https://www.reddit.com/r/TrueOffMyChest/comments/1sfywpl/my_husband_has_started_wearing_makeup_and_i_hate/ --end-card assets/end-cards/thanks-for-watching.gif -v --output example-5",
  },
};

const releaseBase =
  "https://github.com/Thomasssb1/reddit-2-video/releases/download/v1.1.0/";

const studio = document.querySelector("[data-video-studio]");

if (studio) {
  const sampleSelect = studio.querySelector("[data-studio-sample]");
  const clipPicker = studio.querySelector("[data-studio-clip-picker]");
  const clipButtons = studio.querySelectorAll("[data-studio-clip]");
  const terminal = studio.querySelector("app-terminal");
  const options = studio.querySelector("[data-studio-options]");
  const video = studio.querySelector("[data-studio-video]");
  const generateButton = studio.querySelector("[data-studio-generate]");
  const generationOverlay = studio.querySelector("[data-studio-generating]");
  const loadingLabel = studio.querySelector("[data-studio-loading-label]");
  const toggleButton = studio.querySelector("[data-studio-toggle]");
  const muteButton = studio.querySelector("[data-studio-mute]");
  const seek = studio.querySelector("[data-studio-seek]");
  const currentTime = studio.querySelector("[data-studio-current]");
  const duration = studio.querySelector("[data-studio-duration]");
  const community = studio.querySelector("[data-studio-community]");
  const action = studio.querySelector("[data-studio-action]");
  const status = studio.querySelector("[data-studio-status]");
  let selectedExample = sampleSelect.value;
  let generationId = 0;
  let generationTimer;
  let verboseTimers = [];
  let generationDelayElapsed = false;

  function clearVerboseTimers() {
    for (const timer of verboseTimers) clearTimeout(timer);
    verboseTimers = [];
  }

  function setVerboseOutput(message, progress) {
    const filled = Math.floor(progress / 10);
    terminal.output = `\n[verbose] ${message}\n[render] [${"#".repeat(filled)}${"-".repeat(10 - filled)}] ${progress}%`;
  }

  function startVerboseOutput(thisGeneration) {
    if (!examples[selectedExample].command.includes(" -v ")) return;
    setVerboseOutput("Reading the selected post...", 0);
    for (const [delay, message, progress] of [
      [240, "Preparing narration...", 30],
      [500, "Building frames...", 60],
      [760, "Encoding video...", 90],
    ]) {
      verboseTimers.push(
        setTimeout(() => {
          if (generationId !== thisGeneration) return;
          if (studio.dataset.state !== "generating") return;
          setVerboseOutput(message, progress);
        }, delay),
      );
    }
  }

  const optionLabels = {
    "--type": "Type",
    "--count": "Count",
    "--alternate": "Alternate",
    "--title-color": "Title colour",
    "--horror": "Horror",
    "--post-confirmation": "Confirm post",
    "--music": "Music",
    "--youtube-short": "YouTube Short",
    "--repeat": "Repeat",
    "--no-nsfw": "Exclude NSFW",
    "--censor": "Censor",
    "--sort": "Sort",
    "--framerate": "Frame rate",
    "--end-card": "End card",
    "--output": "Output",
    "-v": "Verbose",
  };

  function updateOptions(commandLine) {
    const args = commandLine.split(/\s+/);
    const fields = [];
    for (let index = 1; index < args.length; index += 1) {
      const token = args[index];
      const equalsIndex = token.indexOf("=");
      const flag = equalsIndex === -1 ? token : token.slice(0, equalsIndex);
      let value = equalsIndex === -1 ? "On" : token.slice(equalsIndex + 1);
      if (
        equalsIndex === -1 &&
        args[index + 1] &&
        !args[index + 1].startsWith("-")
      ) {
        value = args[++index];
      }
      if (flag === "--subreddit") continue;

      const field = document.createElement("label");
      field.className = "studio-option";
      const name = document.createElement("span");
      name.textContent = optionLabels[flag] ?? flag;
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.title = value;
      input.disabled = true;
      field.append(name, input);
      fields.push(field);
    }
    options.replaceChildren(...fields);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "--:--";
    const wholeSeconds = Math.floor(seconds);
    return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
  }

  function updateTransport() {
    const isPlaying = !video.paused && !video.ended;
    const hasPreview = ["ready", "playing", "paused"].includes(
      studio.dataset.state,
    );
    toggleButton.disabled = !hasPreview;
    toggleButton.dataset.playing = String(isPlaying);
    toggleButton.setAttribute(
      "aria-label",
      isPlaying ? "Pause preview" : "Play preview",
    );
    const hasDuration = Number.isFinite(video.duration) && video.duration > 0;
    seek.disabled = !hasPreview || !hasDuration;
    seek.max = hasDuration ? String(video.duration) : "100";
    seek.value = hasDuration ? String(video.currentTime) : "0";
    seek.style.setProperty(
      "--seek-progress",
      hasDuration ? `${(video.currentTime / video.duration) * 100}%` : "0%",
    );
    currentTime.textContent = formatTime(video.currentTime);
    duration.textContent = formatTime(video.duration);
  }

  function resetPreview() {
    const example = examples[selectedExample];
    generationId += 1;
    clearTimeout(generationTimer);
    clearVerboseTimers();
    generationDelayElapsed = false;
    video.pause();
    video.removeAttribute("src");
    video.preload = "none";
    video.load();
    studio.dataset.state = "idle";
    generationOverlay.hidden = true;
    loadingLabel.textContent = "Generating...";
    generateButton.disabled = false;
    generateButton.textContent = "Generate video";
    community.textContent = example.community;
    terminal.command = example.command;
    terminal.output = "";
    updateOptions(example.command);
    action.textContent = "Ready to generate";
    status.textContent = "";
    updateTransport();
    clipPicker.hidden = true;
    for (const button of clipButtons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.studioClip === selectedExample),
      );
    }
  }

  sampleSelect.addEventListener("change", () => {
    selectedExample = sampleSelect.value;
    resetPreview();
  });

  for (const button of clipButtons) {
    button.addEventListener("click", () => {
      if (clipPicker.hidden || button.dataset.studioClip === selectedExample)
        return;
      generationId += 1;
      clearTimeout(generationTimer);
      clearVerboseTimers();
      selectedExample = button.dataset.studioClip;
      for (const clipButton of clipButtons) {
        clipButton.setAttribute(
          "aria-pressed",
          String(clipButton.dataset.studioClip === selectedExample),
        );
      }
      video.pause();
      studio.dataset.state = "switching";
      generationOverlay.hidden = false;
      loadingLabel.textContent = "Loading clip...";
      generateButton.disabled = true;
      status.textContent = "Loading clip...";
      video.src = `${releaseBase}${selectedExample}.mp4`;
      video.load();
      updateTransport();
    });
  }

  function showVideoError() {
    clearTimeout(generationTimer);
    clearVerboseTimers();
    studio.dataset.state = "error";
    generationOverlay.hidden = true;
    generateButton.disabled = false;
    generateButton.textContent = "Try again";
    action.textContent = "Preview unavailable";
    status.textContent = "The sample could not load. Please try again.";
    updateTransport();
  }

  function revealGeneratedVideo() {
    if (studio.dataset.state === "switching" && video.readyState >= 2) {
      studio.dataset.state = "ready";
      generationOverlay.hidden = true;
      generateButton.disabled = false;
      status.textContent = "Preview ready.";
      updateTransport();
      return;
    }
    if (
      studio.dataset.state !== "generating" ||
      !generationDelayElapsed ||
      video.readyState < 2
    ) {
      return;
    }
    studio.dataset.state = "ready";
    generationOverlay.hidden = true;
    generateButton.disabled = false;
    generateButton.textContent = "Generate again";
    status.textContent = "Preview ready.";
    clipPicker.hidden = sampleSelect.value !== "example-3-1";
    if (examples[selectedExample].command.includes(" -v ")) {
      clearVerboseTimers();
      setVerboseOutput("Preview ready.", 100);
    }
    updateTransport();
  }

  generateButton.addEventListener("click", () => {
    const thisGeneration = ++generationId;
    clearTimeout(generationTimer);
    clearVerboseTimers();
    generationDelayElapsed = false;
    if (sampleSelect.value === "example-3-1") {
      selectedExample = "example-3-1";
      for (const button of clipButtons) {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.studioClip === selectedExample),
        );
      }
    }
    video.pause();
    studio.dataset.state = "generating";
    generationOverlay.hidden = false;
    loadingLabel.textContent = "Generating...";
    clipPicker.hidden = true;
    generateButton.disabled = true;
    generateButton.textContent = "Generating...";
    status.textContent = "Generating...";
    video.preload = "auto";
    video.src = `${releaseBase}${selectedExample}.mp4`;
    video.load();
    terminal.output = "";
    startVerboseOutput(thisGeneration);
    updateTransport();
    generationTimer = setTimeout(() => {
      if (generationId !== thisGeneration) return;
      generationDelayElapsed = true;
      revealGeneratedVideo();
    }, 1000);
  });

  toggleButton.addEventListener("click", () => {
    if (toggleButton.disabled) return;
    if (video.paused) {
      const thisGeneration = generationId;
      if (video.ended) video.currentTime = 0;
      video.play().catch(() => {
        if (generationId !== thisGeneration) return;
        showVideoError();
      });
    } else {
      video.pause();
    }
  });

  muteButton.addEventListener("click", () => {
    video.muted = !video.muted;
    muteButton.setAttribute("aria-pressed", String(video.muted));
    muteButton.setAttribute(
      "aria-label",
      video.muted ? "Unmute preview" : "Mute preview",
    );
  });

  seek.addEventListener("input", () => {
    if (seek.disabled) return;
    video.currentTime = Number(seek.value);
    updateTransport();
  });

  video.addEventListener("playing", () => {
    if (!["ready", "playing", "paused"].includes(studio.dataset.state)) return;
    studio.dataset.state = "playing";
    status.textContent = "";
    updateTransport();
  });

  video.addEventListener("pause", () => {
    if (studio.dataset.state === "playing") studio.dataset.state = "paused";
    updateTransport();
  });
  video.addEventListener("timeupdate", updateTransport);
  video.addEventListener("loadedmetadata", updateTransport);
  video.addEventListener("durationchange", updateTransport);
  video.addEventListener("loadeddata", revealGeneratedVideo);
  video.addEventListener("ended", () => {
    studio.dataset.state = "paused";
    updateTransport();
  });

  video.addEventListener("error", () => {
    if (["idle", "error"].includes(studio.dataset.state)) return;
    showVideoError();
  });

  resetPreview();
}
