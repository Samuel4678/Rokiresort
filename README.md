# ROKI Resort

Static website with an AI concierge ("Roki").

## Publish (GitHub Pages)
1. Upload the **contents** of this folder to the repo root.
2. Settings → Pages → Deploy from branch → `main` / `(root)`.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder.

## Contact details
Fill in `phone`, `whatsapp` (digits only, with country code e.g. 2547XXXXXXXX) and `email` in `config.js`.
Booking and enquiry buttons use WhatsApp, then email, then fall back to Facebook.

## AI Agent (Groq)
- Settings are in `config.js` (`AI_API_KEY`, `AI_MODEL`).
- SECURITY: the key sits in front-end code, so anyone who visits the site can copy it.
  Set usage limits in console.groq.com, and rotate the key if abused.
  For a safer setup, route requests through a small server/proxy that holds the key.

## Images
Placeholder gradient images are included in `images/`. Replace them with real photos using the same file names:
`hero.webp`, `building.webp`, `fountain.webp`, `cottages.webp`, `courtyard.webp`.
