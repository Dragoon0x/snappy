# Deploying Snappy

Snappy is a **pure static site** — the build output in `dist/` is all you need. There is no server to run, no database to provision, no environment variables to set.

## Prerequisites

- Node 20+
- A GitHub repo (optional but recommended)

```bash
npm install
npm run check         # typecheck + lint + unit + build + bundle budget
```

## Vercel (recommended, one command)

The project ships with a hand-tuned [`vercel.json`](vercel.json) that:

- Rewrites every non-`/assets/*` URL to `/index.html` (SPA routing for React Router hash routes)
- Serves `/assets/*` with `Cache-Control: public, max-age=31536000, immutable`
- Sets `X-Content-Type-Options`, `Referrer-Policy`, and a zero-permissions `Permissions-Policy`

### From the CLI

```bash
npx vercel --prod
```

On first run Vercel will ask you to link the project; accept the defaults:

- **Framework**: Vite (auto-detected)
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`

### From the dashboard

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Accept the auto-detected Vite defaults. No env vars needed.
4. Click Deploy.

Every push to `main` promotes automatically; every PR gets a preview URL.

## Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

Add a redirect for SPA routing in `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Cloudflare Pages

Import the repo at [dash.cloudflare.com/pages](https://dash.cloudflare.com/?to=/:account/pages). Build settings:

- Build command: `npm run build`
- Build output: `dist`
- Node version: `20`

For SPA routing, add `_redirects` in `public/`:

```
/* /index.html 200
```

## GitHub Pages

```bash
npm run build
# push dist/ to a gh-pages branch, or use a GitHub Action
```

GitHub Pages serves from a subpath for project sites. If deploying to `https://user.github.io/snappy`, set a `base` in `vite.config.ts`:

```ts
export default defineConfig({
  base: "/snappy/",
  // ...
});
```

## Self-hosted (any static server)

```bash
npm run build
# dist/ is ready to serve from nginx, Caddy, S3+CloudFront, etc.
```

Just make sure your server:

- Rewrites non-asset paths to `/index.html` (so React Router can handle deep links).
- Serves `.js`, `.css`, and `.woff2` with long-lived `Cache-Control`.
- Does NOT add `no-cache` to files under `/assets/` — they're content-hashed and safe to cache forever.

## PWA notes

Snappy registers a Service Worker via [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox). After first visit, users can install it as a standalone app and use it offline. The service worker uses `autoUpdate` registration — users get new versions on the next reload after a deploy.

If you fork and change the PWA identity, update:

- [`vite.config.ts`](vite.config.ts) → `VitePWA.manifest.name`, `short_name`, `description`, `theme_color`
- [`index.html`](index.html) → `<title>`, `<meta name="description">`, OG tags
- [`public/icons/`](public/icons/) → replace `snappy.svg` + `snappy-mask.svg` with your own
- [`public/favicon.svg`](public/favicon.svg), [`public/og.svg`](public/og.svg)

## Custom domain

On Vercel, Project → Settings → Domains → Add. Snappy works fine under any path or subdomain.

Snappy uses hash-based routing (`/#/s/<payload>` for shared scenes), so it doesn't conflict with path-based routing on the host.

## Verifying a deploy

```bash
# Smoke test the deployed URL
curl -I https://your-domain.com | grep -i content-type   # text/html
curl -s https://your-domain.com | grep -c '<div id="root"'   # 1

# Lighthouse CI (optional)
npx lighthouse https://your-domain.com --output=json --quiet | jq .categories
```

A healthy Snappy deploy should score ≥ 95 on Performance and ≥ 95 on Best Practices in Lighthouse.
