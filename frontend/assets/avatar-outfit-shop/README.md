# Avatar Outfit Shop assets

The portfolio uses these files. The video and screenshots are now present; a missing image shows a placeholder.

| File                  | What to capture                                                                                                                    | Suggested export                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `gameplay.mp4`        | A 20–30 second walkthrough of the real player flow: browse outfits, open one, inspect matching items, and reach a purchase prompt. | 1920×1080, H.264 MP4, muted or with clean game audio, ideally under 15 MB. |
| `gameplay-poster.png` | The poster shown before the gameplay video loads.                                                                                  | 1920×1080 PNG.                                                             |
| `outfit-browser.webp` | The custom outfit discovery interface.                                                                                             | 1600×1000 WebP or larger, with readable UI.                                |
| `purchase-flow.webp`  | The item list or purchase path for one complete outfit.                                                                            | 1600×1000 WebP or larger, with readable UI.                                |

The third gallery slot cycles through five analytics views built from the CSV exports. Hovering over it pauses the cycle. Clicking it opens the current view; the arrow advances through the views. It needs no image asset. Use the real aspect ratio for the two screenshots; the page fits each image in its frame without cropping.

## Capture plan

- **Video:** Start in the outfit browser. Spend a few seconds moving through complete looks, open one to show its matching items, then show how a player reaches a purchase prompt. Stop before completing a purchase. End on a clean frame of the outfit interface. Record actual game UI without a title card or invented interactions.
- **Outfit browser:** Capture the custom interface with several complete outfits visible and one selected. Keep item images and labels large enough to read after the screenshot is displayed in a three-column gallery.
- **Purchase flow:** Show one selected outfit and its matching items with the purchase controls visible. If a purchase prompt is part of the flow, it can appear in the same frame. Hide player names or chat if they distract from the interface.

## Analytics preview

The third slot opens with the asset delivery view, followed by the four exported funnels. The displayed summaries live in `frontend/components/avatar-outfit-shop-analytics-data.js`; the original CSVs stay outside the site. One funnel shows 406 users viewing an outfit, 260 trying it on, and 208 initiating a purchase (51.2% of the first step). Initiating a purchase is not a completed sale.

The expanded asset delivery view shows the exported timing bars first, then the relative p99 line. `avatar-outfit-shop-analytics-components.js` renders the charts, stat cards and work panels. `auto-cycle-card.js` handles the mini card's slide timing, visibility and hover pause.

Each funnel includes the work behind it: individual asset try-on and accessory removal, mobile Quick Buy and whole-outfit buying in the world, basket feedback and empty-basket safeguards, or hunt event tracking. The basket note also uses `purchaseattemptempty.csv`, which recorded 42 empty-basket purchase attempts across the same week.

The solid blocks and user counts come from the 15–21 March 2026 exports. Outlined blocks show approximate post-change step completion rates recalled from the project: outfit detail 72.01% try-on and 85% purchase initiation; quick purchase 63.04% try-on and 84.07% quick buy initiation; basket 84.03% opened and 23.04% checkout initiation; hunt 72.03% hint clicks and 52.12% character finds. The after end-to-end rates multiply the two recalled step rates. There is no after export or after user count, so the site labels these rates as approximate and does not present them as measured CSV results.

The funnel period is **15–21 March 2026**, confirmed separately by you; the funnel CSVs themselves omit their date range. The event and load time exports also cover those dates. The p99 line uses the original API loading time as 100%, then shows the reported 20% reduction with caching and 70% reduction with pre-baked assets. Both reductions are relative to the original. Bundling the assets used more server memory. The export does not contain separate timing measurements for these three delivery approaches.

The load time percentiles beneath that line are estimated from populated timing breakdown cells because the export lacks per-cell frequencies and official percentiles. The highest exported value is outlined in the graph. Do not present these metrics as proof of the 2020–21 lifetime results.

The blue **Play** button uses Roblox's game-start URL for place `4878804776` to open the client. The nearby **Game page** link points to the public details page you provided. If the place ID or URL changes, update both links in `frontend/index.html`.

The current dashboard does not show all of the original 2020–21 game data. The CSVs inspected so far contain recent activity, not the original lifetime totals. Your conservative estimate is that Avatar Outfit Shop earned about 1.5 million Robux and generated about £3,500 in revenue. About £3,000 was cashed out. The revenue figure does not mean that all of it was withdrawn as cash.

The group payout and account cash-out records can trace the withdrawn amount, but an account-wide cash-out screenshot is not a game analytics screenshot. A game-specific funnel or another game-specific metric can illustrate a product decision without exposing private transaction records. The current value of limited items is not additional game revenue.
