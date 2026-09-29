import { loadTemplate } from "../load-template.js";

const templatePromise = loadTemplate(import.meta.url, "icon-button");
const iconDirectory = new URL("../../icons/", import.meta.url);
const availableIcons = new Set(["github", "linkedin"]);

class IconButton extends HTMLElement {
  static get observedAttributes() {
    return ["icon", "href", "label", "target", "disabled"];
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
        this.iconPair = this.shadowRoot.querySelector(".icon-pair");
        this.baseIcon = this.iconPair.querySelector("img:not(.hover-icon)");
        this.hoverIcon = this.iconPair.querySelector(".hover-icon");
        this.mounted = true;
        this.render();
      })
      .catch(console.error);
  }

  attributeChangedCallback() {
    if (this.isConnected && this.mounted) this.render();
  }

  render() {
    const icon = this.getAttribute("icon")?.toLowerCase();
    const label = this.getAttribute("label") || this.textContent.trim() || icon;
    const href = this.getAttribute("href");
    const disabled = this.hasAttribute("disabled");
    const control = document.createElement(href && !disabled ? "a" : "button");
    control.className = "control";
    control.setAttribute("aria-label", label);

    if (control instanceof HTMLAnchorElement) {
      control.href = href;
      const target = this.getAttribute("target");
      if (target) control.target = target;
      if (target === "_blank") {
        control.rel = "noopener noreferrer";
        control.setAttribute("aria-label", `${label} (opens in a new tab)`);
      }
    } else {
      control.type = "button";
      control.disabled = disabled;
    }

    if (availableIcons.has(icon)) {
      this.baseIcon.src = new URL(`${icon}.svg`, iconDirectory).href;
      this.hoverIcon.src = new URL(`${icon}-blue.svg`, iconDirectory).href;
      control.append(this.iconPair);
    } else {
      control.textContent = label;
    }

    this.mountPoint.replaceChildren(control);
  }
}

customElements.define("icon-button", IconButton);
