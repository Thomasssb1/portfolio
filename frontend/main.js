const wordmark = document.querySelector(".wordmark");
const wordmarkText = wordmark?.querySelector(".wordmark-text");

if (wordmark && wordmarkText) {
  const originalText = wordmarkText.textContent;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame;

  function restoreName() {
    cancelAnimationFrame(animationFrame);
    wordmarkText.textContent = originalText;
  }

  function scrambleName() {
    if (reducedMotion.matches) return;

    restoreName();
    const startedAt = performance.now();
    const duration = 650;

    function update(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const revealed = Math.floor(progress * (originalText.length + 1));

      wordmarkText.textContent = [...originalText]
        .map((character, index) => {
          if (character === " " || index < revealed) return character;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      } else {
        wordmarkText.textContent = originalText;
      }
    }

    update(startedAt);
  }

  wordmark.addEventListener("pointerenter", scrambleName);
  wordmark.addEventListener("focus", scrambleName);
  wordmark.addEventListener("pointerleave", restoreName);
  wordmark.addEventListener("blur", restoreName);
  reducedMotion.addEventListener("change", restoreName);
}
