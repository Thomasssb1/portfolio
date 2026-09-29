import { loadTemplate } from "../load-template.js";

const templatePromise = loadTemplate(import.meta.url, "scramble-text");

class ScrambleText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).append(document.createElement("slot"));
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.startScramble = () => this.scramble();
    this.stopScramble = () => this.restore();
  }

  connectedCallback() {
    this.originalText = this.getAttribute("text") || this.textContent.trim();
    if (this.mounted) {
      this.bind();
      return;
    }

    templatePromise
      .then((template) => {
        if (!this.isConnected || this.mounted) return;
        this.shadowRoot.replaceChildren(template.content.cloneNode(true));
        this.visual = this.shadowRoot.querySelector(".visual");
        this.accessible = this.shadowRoot.querySelector(".accessible");
        this.mounted = true;
        this.bind();
      })
      .catch(console.error);
  }

  bind() {
    this.visual.textContent = this.originalText;
    this.accessible.textContent = this.originalText;
    this.trigger = this.closest("a, button") || this;
    this.trigger.addEventListener("pointerenter", this.startScramble);
    this.trigger.addEventListener("focus", this.startScramble);
    this.trigger.addEventListener("pointerleave", this.stopScramble);
    this.trigger.addEventListener("blur", this.stopScramble);
    this.reducedMotion.addEventListener("change", this.stopScramble);
  }

  disconnectedCallback() {
    if (!this.mounted) return;
    this.trigger.removeEventListener("pointerenter", this.startScramble);
    this.trigger.removeEventListener("focus", this.startScramble);
    this.trigger.removeEventListener("pointerleave", this.stopScramble);
    this.trigger.removeEventListener("blur", this.stopScramble);
    this.reducedMotion.removeEventListener("change", this.stopScramble);
    this.restore();
  }

  restore() {
    cancelAnimationFrame(this.animationFrame);
    this.visual.textContent = this.originalText;
  }

  scramble() {
    if (this.reducedMotion.matches) return;

    this.restore();
    const startedAt = performance.now();
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const duration = 650;

    const update = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const revealed = Math.floor(progress * (this.originalText.length + 1));

      this.visual.textContent = [...this.originalText]
        .map((character, index) => {
          if (character === " " || index < revealed) return character;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(update);
      } else {
        this.visual.textContent = this.originalText;
      }
    };

    update(startedAt);
  }
}

customElements.define("scramble-text", ScrambleText);
