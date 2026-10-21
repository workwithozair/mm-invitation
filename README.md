# Masoom & Meeza — Responsive Wedding Invitation

A responsive HTML/CSS/JavaScript recreation of the collage-style wedding invitation shown in the reference screenshots. The desktop collage scales up with the viewport instead of remaining capped at a mobile-sized width. Its type sizes are tied to the collage canvas using CSS container units, so the envelope, postcard, date card, floral elements, swan Details button, RSVP badge, and oval story photo scale together.

This is an original implementation inspired by the reference composition, not a pixel-perfect copy of the seller's paid template.

## Run locally
The site reads `data.json` with `fetch`, so use a local web server rather than opening `index.html` directly.

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

## Routes
- `/` — envelope cover and invitation collage
- `/details/` — separate wedding details page with live countdown and map links
- `/love-story/` — separate love-story page and memory gallery
- `/?view=rsvp#opened` — opens the invitation collage and RSVP form

The home page also supports `#opened` to return directly to the opened collage. The date card and pink swan route to `/details/`; the oval portrait and Love Story label route to `/love-story/`; the location postcard opens the configured map URL.

## Customize
Edit `data.json` to change names, dates, venues, the map URL, contact email, the short story, and gallery entries. The countdown reads `wedding.date` in ISO 8601 format including the intended timezone.

## RSVP limitation
The RSVP demo saves submissions in the visitor's browser `localStorage`; it does not transmit or centrally collect guest responses. Connect a form provider or backend before using it for a real wedding.

## Assets
The `assets` folder includes floral artwork generated for this project, local wedding-detail and lake photos, and a couple portrait placeholder. Fonts are loaded from Google Fonts, so internet access is needed for those fonts. Gallery photos can be replaced through `data.json`.

## Free hosting
Deploy the folder to GitHub Pages, Netlify, or Cloudflare Pages. Keep `index.html`, `styles.css`, `app.js`, `data.json`, `subpages.css`, `subpages.js`, `details/`, `love-story/`, and `assets/` together in the published root.


## Recent updates
- Fixed swan Details button click/touch layer.
- Slowed the envelope opening and delayed page transition until the animation completes.
- Replaced demo photo URLs in data.json with deterministic Picsum Photos images.
- Details and Love Story routes are available at /details/ and /love-story/.

- Updated swan hit-testing so transparent areas of the swan do not block collage links; Details and Love Story cards now have real `href` destinations as well as delegated navigation.
- Matched the swan's size and placement to the latest reference image while leaving the other collage assets and their positions unchanged; its transparent area remains click-through.
# mm-invitation
