export async function loadTemplate(scriptUrl, name) {
  const [html, css] = await Promise.all(
    [`${name}.html`, `${name}.styles.css`].map(async (file) => {
      const response = await fetch(new URL(file, scriptUrl));
      if (!response.ok) throw new Error(`Could not load ${file}`);
      return response.text();
    }),
  );

  const template = document.createElement("template");
  template.innerHTML = html;
  const style = document.createElement("style");
  style.textContent = css;
  template.content.prepend(style);
  return template;
}
