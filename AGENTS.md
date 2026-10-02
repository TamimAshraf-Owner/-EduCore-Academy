# EduCore Academy — Base44 Dev Notes

## What this is
A pure static front-end app (no backend, no build step, no framework). Files:
- `index.html` — app shell, loads `script.js` then `main.js`
- `script.js` — shared utilities (storage, validation, theme, helpers)
- `main.js` — application logic (students, results, certificates, navigation)
- `style.css` — all styling
- `function.js` — a combined duplicate of script.js + main.js; **not loaded by index.html**, kept for reference only

All state is in `localStorage` (key `educore_result_system_v2`). No server, no database, no external services, no credentials.

## Running it
`docker compose -f docker-compose.base44.yml up -d` serves the site on port 3000 via a Vite dev server (node:22-alpine). Vite provides live reload; `node_modules` is in a named volume so installs don't clobber the bind mount.

## Editing
HTML/CSS/JS edits hot-reload via Vite. No build or migration step needed.
