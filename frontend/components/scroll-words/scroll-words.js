import { loadTemplate } from "../load-template.js";

const templatePromise = loadTemplate(import.meta.url, "scroll-words");

class ScrollWords extends HTMLElement {
  static get observedAttributes() {
    return ["words"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).append(document.createElement("slot"));
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.updateMotion = () => this.animateWords();
  }

  connectedCallback() {
    if (this.mounted) {
      this.render();
      this.reducedMotion.addEventListener("change", this.updateMotion);
      return;
    }

    templatePromise
      .then((template) => {
        if (!this.isConnected || this.mounted) return;
        this.shadowRoot.replaceChildren(template.content.cloneNode(true));
        this.track = this.shadowRoot.querySelector(".track");
        this.accessible = this.shadowRoot.querySelector(".accessible");
        this.mounted = true;
        this.render();
        this.reducedMotion.addEventListener("change", this.updateMotion);
      })
      .catch(console.error);
  }

  disconnectedCallback() {
    if (!this.mounted) return;
    this.animation?.cancel();
    this.reducedMotion.removeEventListener("change", this.updateMotion);
  }

  attributeChangedCallback() {
    if (this.isConnected && this.mounted) this.render();
  }

  render() {
    const fallback = this.textContent.trim().replace(/\.$/, "");
    this.words = (this.getAttribute("words") || fallback)
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);

    if (!this.words.length) return;

    const lastWord = this.words.at(-1);
    const earlierWords = this.words.slice(0, -1);
    const list = earlierWords.length
      ? `${earlierWords.join(", ")}${earlierWords.length > 1 ? "," : ""} and ${lastWord}`
      : lastWord;
    this.accessible.textContent = `${list}.`;

    const slides = [...this.words, this.words[0]].map((word) => {
      const slide = document.createElement("span");
      slide.className = "slide";
      slide.append(word);
      const period = document.createElement("span");
      period.className = "period";
      period.textContent = ".";
      slide.append(period);
      return slide;
    });

    this.track.replaceChildren(...slides);
    this.animateWords();
  }

  animateWords() {
    this.animation?.cancel();
    if (this.reducedMotion.matches || this.words.length < 2) return;

    const count = this.words.length;
    const position = (index) => `translateY(-${(index * 100) / (count + 1)}%)`;
    const frames = [{ offset: 0, transform: position(0) }];

    for (let index = 0; index < count; index += 1) {
      frames.push({
        offset: (index + 0.68) / count,
        transform: position(index),
        easing: "cubic-bezier(0.76, 0, 0.24, 1)",
      });
      frames.push({
        offset: (index + 1) / count,
        transform: position(index + 1),
      });
    }

    this.animation = this.track.animate(frames, {
      duration: count * 3300,
      iterations: Infinity,
    });
  }
}

customElements.define("scroll-words", ScrollWords);
