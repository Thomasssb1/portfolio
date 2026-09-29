const carousels = document.querySelectorAll("[data-experience-carousel]");

for (const carousel of carousels) {
  const track = carousel.querySelector("[data-experience-track]");
  const button = carousel.parentElement.querySelector(".experience-next");
  const cards = track ? [...track.children] : [];

  if (!track || !button || cards.length < 2) {
    button?.setAttribute("hidden", "");
    continue;
  }

  const updateButtonLabel = () => {
    const atLastCard =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    button.setAttribute(
      "aria-label",
      atLastCard ? "Show first experience" : "Show next experience",
    );
  };

  button.addEventListener("click", () => {
    const atLastCard =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;

    track.scrollTo({
      left: atLastCard ? 0 : track.scrollLeft + track.clientWidth,
      behavior: "smooth",
    });
  });

  track.addEventListener("scroll", updateButtonLabel, { passive: true });
  updateButtonLabel();
}
