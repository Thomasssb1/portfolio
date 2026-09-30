import { loadTemplate } from "../load-template.js";

const templatePromise = loadTemplate(import.meta.url, "app-terminal");

class AppTerminal extends HTMLElement {
  static get observedAttributes() {
    return ["title", "shell", "command"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._output = "";
    this.narrowLayout = window.matchMedia("(max-width: 640px)");
    this.onLayoutChange = () => {
      this.syncHandle();
      this.clampPosition();
    };
    this.onResize = () => this.clampPosition();
  }

  get command() {
    return this.getAttribute("command") || "";
  }

  set command(value) {
    this.setAttribute("command", value ?? "");
  }

  get output() {
    return this._output;
  }

  set output(value) {
    this._output = String(value ?? "");
    this.renderOutput();
  }

  connectedCallback() {
    if (this.mounted) {
      this.startObserving();
      this.render();
      return;
    }

    templatePromise
      .then((template) => {
        if (!this.isConnected || this.mounted) return;
        this.shadowRoot.replaceChildren(template.content.cloneNode(true));
        this.handle = this.shadowRoot.querySelector(".bar");
        this.code = this.shadowRoot.querySelector(".code");
        this.size = this.shadowRoot.querySelector("[data-size]");
        this.commandElement = this.shadowRoot.querySelector("[data-command]");
        this.outputElement = this.shadowRoot.querySelector("[data-output]");
        this.titleElement = this.shadowRoot.querySelector("[data-title]");
        this.shellElement = this.shadowRoot.querySelector("[data-shell]");
        this.bindControls();
        this.mounted = true;
        this.startObserving();
        this.render();
      })
      .catch(console.error);
  }

  disconnectedCallback() {
    this.narrowLayout.removeEventListener("change", this.onLayoutChange);
    window.removeEventListener("resize", this.onResize);
    this.resizeObserver?.disconnect();
  }

  attributeChangedCallback() {
    if (this.mounted) this.render();
  }

  render() {
    this.titleElement.textContent = this.getAttribute("title") || "Terminal";
    this.shellElement.textContent = this.getAttribute("shell") || "zsh";
    this.commandElement.textContent = this.command;
    this.renderOutput();
  }

  renderOutput() {
    if (!this.mounted) return;
    this.outputElement.textContent = this._output;
    requestAnimationFrame(() => {
      if (!this.isConnected) return;
      this.code.scrollTop = this.code.scrollHeight;
      this.updateSize();
      this.clampPosition();
    });
  }

  startObserving() {
    this.narrowLayout.addEventListener("change", this.onLayoutChange);
    window.addEventListener("resize", this.onResize);
    if ("ResizeObserver" in window) {
      this.resizeObserver ??= new ResizeObserver(() => this.updateSize());
      this.resizeObserver.observe(this.code);
    }
    this.syncHandle();
    requestAnimationFrame(() => this.updateSize());
  }

  syncHandle() {
    this.handle.disabled = this.narrowLayout.matches;
  }

  updateSize() {
    if (!this.isConnected) return;
    const style = getComputedStyle(this.code);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font = style.font;
    const characterWidth = context.measureText("M").width;
    const contentWidth =
      this.code.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const contentHeight =
      this.code.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom);
    const columns = Math.max(1, Math.floor(contentWidth / characterWidth));
    const rows = Math.max(
      1,
      Math.floor(contentHeight / parseFloat(style.lineHeight)),
    );
    this.size.textContent = `${columns}×${rows}`;
  }

  boundary() {
    return this.boundsElement || this.offsetParent || this.parentElement;
  }

  moveTo(x, y) {
    const boundary = this.boundary();
    if (!boundary) return;
    const overflow = 32;
    const maxX = Math.max(
      -overflow,
      boundary.clientWidth - this.offsetWidth + overflow,
    );
    const maxY = Math.max(
      -overflow,
      boundary.clientHeight - this.offsetHeight + overflow,
    );
    this.style.setProperty(
      "--terminal-x",
      `${Math.min(Math.max(x, -overflow), maxX)}px`,
    );
    this.style.setProperty(
      "--terminal-y",
      `${Math.min(Math.max(y, -overflow), maxY)}px`,
    );
  }

  currentPosition() {
    const position = getComputedStyle(this);
    return {
      x: Number.parseFloat(position.left),
      y: Number.parseFloat(position.top),
    };
  }

  clampPosition() {
    if (this.narrowLayout.matches || !this.mounted) return;
    const boundary = this.boundary();
    if (!boundary) return;
    const position = this.currentPosition();
    const overflow = 32;
    const maxX = Math.max(
      -overflow,
      boundary.clientWidth - this.offsetWidth + overflow,
    );
    const maxY = Math.max(
      -overflow,
      boundary.clientHeight - this.offsetHeight + overflow,
    );
    if (position.x < -overflow || position.x > maxX) {
      this.style.setProperty(
        "--terminal-x",
        `${Math.min(Math.max(position.x, -overflow), maxX)}px`,
      );
    }
    if (position.y < -overflow || position.y > maxY) {
      this.style.setProperty(
        "--terminal-y",
        `${Math.min(Math.max(position.y, -overflow), maxY)}px`,
      );
    }
  }

  bindControls() {
    let dragOffset;
    this.handle.addEventListener("pointerdown", (event) => {
      if (this.narrowLayout.matches || event.button !== 0) return;
      const bounds = this.getBoundingClientRect();
      dragOffset = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      this.handle.setPointerCapture(event.pointerId);
    });

    this.handle.addEventListener("pointermove", (event) => {
      if (!dragOffset) return;
      const bounds = this.boundary()?.getBoundingClientRect();
      if (!bounds) return;
      this.moveTo(
        event.clientX - bounds.left - dragOffset.x,
        event.clientY - bounds.top - dragOffset.y,
      );
    });

    const stopDragging = () => {
      dragOffset = undefined;
    };
    this.handle.addEventListener("pointerup", stopDragging);
    this.handle.addEventListener("pointercancel", stopDragging);
    this.handle.addEventListener("lostpointercapture", stopDragging);
    this.handle.addEventListener("keydown", (event) => {
      if (this.narrowLayout.matches || !event.key.startsWith("Arrow")) return;
      event.preventDefault();
      const position = this.currentPosition();
      const step = event.shiftKey ? 20 : 10;
      this.moveTo(
        position.x +
          (event.key === "ArrowRight" ? step : 0) -
          (event.key === "ArrowLeft" ? step : 0),
        position.y +
          (event.key === "ArrowDown" ? step : 0) -
          (event.key === "ArrowUp" ? step : 0),
      );
    });
  }
}

customElements.define("app-terminal", AppTerminal);
