// Before counts come from Roblox Analytics CSV exports in Downloads, inspected
// 30 Sep 2026. After step completion rates are approximate project recollections;
// no post-change export is available. Do not derive after user counts from them.
// The user supplied the 15–21 Mar 2026 funnel date range; the funnel CSVs omit it.
// "Purchase initiated" is not a sale.
export const analyticsPeriod = "15 Mar – 21 Mar 2026";

export const funnels = [
  {
    id: "outfit-detail",
    source: "outfitdetailfunnel.csv",
    title: "From outfit detail to purchase intent",
    workTitle: "What I changed",
    work: "I made the mannequin clickable so players could try on individual assets, added an icon to show that it could be clicked, and let players remove accessories without replacing the whole outfit.",
    steps: [
      { label: "Outfit detail viewed", users: 406 },
      { label: "Outfit tried on", users: 260, afterCompletion: 0.7201 },
      { label: "Purchase initiated", users: 208, afterCompletion: 0.85 },
    ],
  },
  {
    id: "quick-purchase",
    source: "quickpurchasefunnel.csv",
    title: "From hover to quick buy intent",
    workTitle: "What I changed",
    work: "I made Quick Buy larger and always visible on mobile, where hover is unavailable. I also added a whole-outfit Buy button outside the main browsing UI so players could purchase while exploring the world.",
    steps: [
      { label: "Outfit hovered", users: 592 },
      { label: "Outfit tried on", users: 277, afterCompletion: 0.6304 },
      { label: "Quick buy initiated", users: 219, afterCompletion: 0.8407 },
    ],
  },
  {
    id: "basket",
    source: "basketpurchasefunnel.csv",
    title: "From basket add to checkout intent",
    workTitle: "What I changed",
    work: "The separate empty-purchase event logged 42 attempts in this period. I blocked access to an empty basket, added a sound and item-count badge when items were added, and warned players before leaving with items still in the basket.",
    steps: [
      { label: "Item added to basket", users: 202 },
      { label: "Basket opened", users: 141, afterCompletion: 0.8403 },
      { label: "Checkout initiated", users: 3, afterCompletion: 0.2304 },
    ],
  },
  {
    id: "hunt",
    source: "huntfunnel.csv",
    title: "From hunt menu to character found",
    workTitle: "What I changed",
    work: "I logged menu opens, hint clicks and character finds separately. I then added an award for completing the hunt to give players a clearer reason to finish it.",
    steps: [
      { label: "Hunt menu opened", users: 213 },
      { label: "Hint clicked", users: 144, afterCompletion: 0.7203 },
      { label: "Character found", users: 65, afterCompletion: 0.5212 },
    ],
  },
];

// UI load time export: 15–21 Mar 2026. The percentile values below use linear
// interpolation across populated timing breakdown cells. The export gives
// rounded breakdown labels but no frequency per cell, so this is an estimate.
// The p99 stage values are relative changes recalled from the project. The CSV
// does not contain separate measurements for the three asset delivery stages.
export const loadTime = {
  title: "How asset delivery cut p99 load time",
  median: 10.4,
  p95: 27.7,
  p99: 79.3,
  max: 175.0,
  p99Stages: [
    { label: "Live API", relative: 1, detail: "Original" },
    { label: "Cached", relative: 0.8, detail: "20% lower" },
    { label: "Pre-baked", relative: 0.3, detail: "70% lower" },
  ],
};
