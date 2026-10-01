export function tableData(table) {
  const headers = [...table.tHead.rows[0].cells].map((cell) =>
    cell.textContent.trim(),
  );
  const rows = [...table.tBodies[0].rows].map((row) =>
    [...row.cells].map((cell) => cell.textContent.trim()),
  );
  return { headers, rows };
}

export function toCsv({ headers, rows }) {
  const escape = (value) => {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return (
    [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n") +
    "\r\n"
  );
}

export function toJson({ headers, rows }) {
  return JSON.stringify(
    rows.map((row) =>
      Object.fromEntries(headers.map((key, index) => [key, row[index]])),
    ),
    null,
    2,
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const demo =
  typeof document === "undefined"
    ? null
    : document.querySelector("[data-extension-demo]");

if (demo) {
  const tabs = [...demo.querySelectorAll("[data-extension-tab]")];
  const panels = [...demo.querySelectorAll("[data-extension-panel]")];
  const images = [...demo.querySelectorAll("[data-demo-image]")].map(
    (figure, index) => ({
      index,
      name: figure.querySelector("figcaption").firstChild.textContent.trim(),
      src: figure.querySelector("img").src,
      selected: true,
    }),
  );
  const dedupe = demo.querySelector("[data-extension-dedupe]");
  const imageList = demo.querySelector("[data-extension-image-list]");
  const imageCount = demo.querySelector("[data-extension-image-count]");
  const imageOutput = demo.querySelector("[data-extension-image-output]");
  const imageDownload = demo.querySelector("[data-extension-image-download]");
  const tableSelect = demo.querySelector("[data-extension-table-select]");
  const page = demo.querySelector("[data-extension-page]");
  const formatButtons = [...demo.querySelectorAll("[data-extension-format]")];
  const preview = demo.querySelector("[data-extension-preview]");
  const filename = demo.querySelector("[data-extension-filename]");
  const tableDownload = demo.querySelector("[data-extension-table-download]");
  const status = demo.querySelector("[data-extension-status]");
  const logo = demo.querySelector("[data-extension-logo]");
  const tabIcon = demo.querySelector("[data-extension-tab-icon]");
  const title = demo.querySelector("[data-extension-title]");
  const popup = demo.querySelector("[data-extension-popup]");
  const invite = demo.querySelector("[data-extension-invite]");
  const launchButtons = [...demo.querySelectorAll("[data-extension-launch]")];
  const closeButton = demo.querySelector("[data-extension-close]");
  let format = "csv";
  let activeTool = "images";

  function visibleImages() {
    const seen = new Set();
    return images.filter((item) => {
      if (dedupe.checked && seen.has(item.src)) return false;
      seen.add(item.src);
      return true;
    });
  }

  function renderImages() {
    const shown = visibleImages();
    imageList.replaceChildren();
    for (const item of shown) {
      const label = document.createElement("label");
      label.className = "extension-image-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = item.selected;
      input.addEventListener("change", () => {
        item.selected = input.checked;
        renderImageOutput();
      });
      const thumb = document.createElement("img");
      thumb.src = item.src;
      thumb.alt = "";
      const name = document.createElement("span");
      name.textContent = item.name;
      label.append(input, thumb, name);
      imageList.append(label);
    }
    imageCount.textContent = `${shown.length} found`;
    renderImageOutput();
  }

  function renderImageOutput() {
    const count = visibleImages().filter((item) => item.selected).length;
    imageOutput.textContent = `${count} WebP ${count === 1 ? "image" : "images"} in a ZIP`;
    imageDownload.disabled = count === 0;
  }

  function selectedTable() {
    return demo.querySelector(`[data-demo-table="${tableSelect.value}"]`);
  }

  function currentExport() {
    const data = tableData(selectedTable());
    return format === "csv" ? toCsv(data) : toJson(data);
  }

  function renderTable() {
    for (const table of demo.querySelectorAll("[data-demo-table]")) {
      table
        .closest(".extension-page-table-wrap")
        .classList.toggle("is-selected", table === selectedTable());
    }
    filename.textContent = `${tableSelect.value}.${format}`;
    preview.textContent = currentExport();
    tableDownload.textContent = `Download ${format.toUpperCase()}`;
  }

  function revealSelectedTable() {
    const table = selectedTable();
    page.scrollTo({
      top:
        page.scrollTop +
        table.getBoundingClientRect().top -
        page.getBoundingClientRect().top -
        12,
      behavior: "smooth",
    });
  }

  function syncLaunchers() {
    for (const button of launchButtons) {
      const active = button.dataset.extensionLaunch === activeTool;
      const expanded = active && !popup.hidden;
      const name =
        button.dataset.extensionLaunch === "images"
          ? "Mass Image Downloader"
          : "Table to CSV";
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute(
        "aria-label",
        `${expanded ? "Close" : "Open"} ${name}`,
      );
    }
  }

  function setOpen(open) {
    popup.hidden = !open;
    invite.hidden = open;
    demo.dataset.open = String(open);
    syncLaunchers();
    if (open && window.matchMedia("(max-width: 900px)").matches) {
      requestAnimationFrame(() =>
        popup.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      );
    }
  }

  function closePanel() {
    setOpen(false);
    launchButtons
      .find((button) => button.dataset.extensionLaunch === activeTool)
      .focus();
  }

  function selectTab(tab, moveFocus = false) {
    for (const button of tabs) {
      const active = button === tab;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels)
      panel.hidden = panel.dataset.extensionPanel !== tab.dataset.extensionTab;
    activeTool = tab.dataset.extensionTab;
    demo.dataset.mode = activeTool;
    const isImages = activeTool === "images";
    const iconUrl = isImages ? logo.dataset.imageSrc : logo.dataset.tableSrc;
    logo.src = iconUrl;
    tabIcon.src = iconUrl;
    title.textContent = isImages ? "Mass Image Downloader" : "Table to CSV";
    syncLaunchers();
    if (isImages) page.scrollTo({ top: 0, behavior: "smooth" });
    else revealSelectedTable();
    status.textContent = "";
    if (moveFocus) tab.focus();
  }

  for (const button of launchButtons) {
    button.addEventListener("click", () => {
      if (button.dataset.extensionLaunch === activeTool && !popup.hidden) {
        setOpen(false);
        return;
      }
      setOpen(true);
      selectTab(
        tabs.find(
          (tab) => tab.dataset.extensionTab === button.dataset.extensionLaunch,
        ),
      );
    });
  }

  closeButton.addEventListener("click", closePanel);
  popup.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closePanel();
  });

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      selectTab(tabs[next], true);
    });
  }

  dedupe.addEventListener("change", renderImages);
  tableSelect.addEventListener("change", () => {
    renderTable();
    revealSelectedTable();
  });
  for (const button of formatButtons) {
    button.addEventListener("click", () => {
      format = button.dataset.extensionFormat;
      for (const option of formatButtons)
        option.setAttribute("aria-pressed", String(option === button));
      renderTable();
    });
  }

  tableDownload.addEventListener("click", () => {
    const type =
      format === "csv"
        ? "text/csv;charset=utf-8"
        : "application/json;charset=utf-8";
    downloadBlob(new Blob([currentExport()], { type }), filename.textContent);
    status.textContent = `${filename.textContent} downloaded.`;
  });

  imageDownload.addEventListener("click", async () => {
    const selected = visibleImages().filter((item) => item.selected);
    imageDownload.disabled = true;
    status.textContent = "Preparing sample images...";
    try {
      const files = await Promise.all(
        selected.map(async (item, index) => {
          const response = await fetch(item.src);
          if (!response.ok)
            throw new Error(`Image request failed: ${response.status}`);
          const data = new Uint8Array(await response.arrayBuffer());
          return {
            name: `${String(index + 1).padStart(2, "0")}-${item.name.toLowerCase().replaceAll(" ", "-")}.webp`,
            data,
          };
        }),
      );
      downloadBlob(createZip(files), "garden-birds-images.zip");
      status.textContent = `Downloaded ${files.length} sample ${files.length === 1 ? "image" : "images"}.`;
    } catch {
      status.textContent = "The image download failed. Please try again.";
    } finally {
      imageDownload.disabled = false;
    }
  });

  renderImages();
  renderTable();
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZip(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const directory = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const view = new DataView(central.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint32(16, crc, true);
    view.setUint32(20, data.length, true);
    view.setUint32(24, data.length, true);
    view.setUint16(28, name.length, true);
    view.setUint32(42, offset, true);
    central.set(name, 46);
    directory.push(central);
    offset += local.length + data.length;
  }
  const directorySize = directory.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, directorySize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: "application/zip" });
}
