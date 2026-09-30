# Avatar Outfit Shop assets

Add the following files to this directory. The portfolio picks them up automatically; missing files show a quiet placeholder.

| File                     | What to capture                                                                                                    | Suggested export                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `gameplay.mp4`           | A 20–30 second walkthrough: outfit browsing, matching items, and the purchase path. Capture the real game UI.      | 1920×1080, H.264 MP4, muted or with clean game audio, ideally under 15 MB. |
| `gameplay-poster.webp`   | A clear frame from the walkthrough to show before playback.                                                        | 1600×900 WebP, ideally under 300 KB.                                       |
| `outfit-browser.webp`    | The custom outfit discovery interface.                                                                             | 1600×1000 WebP or larger, with readable UI.                                |
| `purchase-flow.webp`     | The item list or purchase path for one complete outfit.                                                            | 1600×1000 WebP or larger, with readable UI.                                |
| `creator-dashboard.webp` | A dated Creator Dashboard capture supporting the visits and revenue figures. Crop or hide private account details. | 1600×1000 WebP or larger, with readable numbers and date.                  |

Use the real aspect ratio if a screenshot is not 16:10. The page will fit the full image in its frame without cropping it.

The blue **Play** button uses Roblox's game-start URL for place `4878804776` to open the client. The nearby **Game page** link points to the public details page you provided. If the place ID or URL changes, update both links in `frontend/index.html`.

If the dashboard capture shows newer numbers, update the two figures in `frontend/index.html` at the same time. Keep the currency and meaning of the revenue figure consistent with the capture.
