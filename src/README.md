# API docs viewer

A static Angular app (no server) that renders the GitBook markdown in `../docs` as an API integration viewer.

- **Navigation** comes from `docs/SUMMARY.md`, the same file GitBook uses.
- **Examples:** a code block with a title is shown as a tabbed example panel next to its `##` section. Use GitBook's own syntax so GitBook shows the title too:

  ````md
  {% code title="Response · 200 OK" %}
  ```json
  { "id": "bk_123" }
  ```
  {% endcode %}
  ````

  ```` ```json title="Response · 200 OK" ```` also works.
- **Endpoints:** inline code like `` `GET /v1/bookings` `` is shown as a method badge.
- **Copy for agent:** copies a page, or every page as one bundle, as plain markdown. GitBook `{% %}` tags are converted first.

## Develop

```bash
npm install
npm start          # http://localhost:4200
```

The markdown is served live from `../docs`, so edits show up after a reload.

## Build & deploy

```bash
npm run build      # -> dist/viewer/browser
```

Upload `dist/viewer/browser` to any static host (S3/CloudFront, GitHub Pages, Netlify, Azure Static Web Apps…).
It uses path routing (`/endpoints/bookings`, no `/#/`; old `/#/…` links redirect), so the host must serve `index.html` for any
path that isn't a real file (SPA fallback):

- **S3/CloudFront:** custom error response 403/404 → `/index.html`, status 200.
- **Netlify:** `public/_redirects` with `/*  /index.html  200`.
- **Azure Static Web Apps:** `navigationFallback.rewrite: "/index.html"` in `staticwebapp.config.json`.
- **GitHub Pages:** copy `index.html` to `404.html` after the build.

`<base href>` is `/`. To serve from a sub-path, build with `npm run build -- --base-href /docs/`.
