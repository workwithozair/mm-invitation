# Wedding invitation website

Serve this repository from its root so the pages can load `data.json` and the shared Canva assets.

- `/` — invitation landing page
- `/envelope/` — envelope page
- `/details/` — reception details
- `/our-story/` — story page
- `/rsvp/` — RSVP form

The main and envelope pages use the Canva export in `_assets`; Our Story uses `styles.css`, `subpages.css`, and `subpages.js`.
# Share preview image

Set `images.sharePreview` in `data.json` to the path of the image you want shown when the invitation link is shared. The current image is `assets/og-image.jpg`, a 1200 × 630 card with the M/M icon. The Pages deployment workflow updates the Open Graph and Twitter image URLs from this setting.

For a manual deployment, run `node scripts/sync-share-preview.mjs` before publishing the site files.
