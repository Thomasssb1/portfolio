import { loadTemplate } from "../load-template.js";

const templatePromise = loadTemplate(import.meta.url, "site-button");

class SiteButton extends HTMLElement {
  static get observedAttributes() {
    return ["href", "target", "type", "disabled"];
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
        this.mountPoint = this.shadowRoot.querySelector(".mount");
        this.slotElement = this.shadowRoot.querySelector("slot");
        this.mounted = true;
        this.render();
      })
      .catch(console.error);
  }

  attributeChangedCallback() {
    if (this.isConnected && this.mounted) this.render();
  }

  render() {
    const href = this.getAttribute("href");
    const disabled = this.hasAttribute("disabled");
    const control = document.createElement(href && !disabled ? "a" : "button");
    control.className = "control";

    if (control instanceof HTMLAnchorElement) {
      control.href = href;
      const target = this.getAttribute("target");
      if (target) control.target = target;
      if (target === "_blank") control.rel = "noopener noreferrer";
    } else {
      control.type = this.getAttribute("type") || "button";
      control.disabled = disabled;
    }

    control.append(this.slotElement);
    this.mountPoint.replaceChildren(control);
  }
}

customElements.define("site-button", SiteButton);
