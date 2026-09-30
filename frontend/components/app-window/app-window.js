import { loadTemplate } from "../load-template.js";

const templatePromise = loadTemplate(import.meta.url, "app-window");

class AppWindow extends HTMLElement {
  static get observedAttributes() {
    return ["title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).append(document.createElement("slot"));
  }

  connectedCallback() {
    if (this.mounted) {
      this.render();
      return;
    }

    templatePromise
      .then((template) => {
        if (!this.isConnected || this.mounted) return;
        this.shadowRoot.replaceChildren(template.content.cloneNode(true));
        this.titleElement = this.shadowRoot.querySelector("[data-title]");
        this.mounted = true;
        this.render();
      })
      .catch(console.error);
  }

  attributeChangedCallback() {
    if (this.mounted) this.render();
  }

  render() {
    this.titleElement.textContent = this.getAttribute("title") || "";
  }
}

customElements.define("app-window", AppWindow);
