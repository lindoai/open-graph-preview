# Open Graph Preview

Preview how a public page may look when shared via Open Graph metadata.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lindoai/open-graph-preview)

## Features

- extracts `og:title`, `og:description`, `og:image`, and `og:site_name`
- returns JSON
- can render a simple HTML social-card preview

## Local development

```bash
npm install
npm run dev
npm run typecheck
```

## Deploy

```bash
npm run deploy
```

## Production env

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## API

### GET `/api/preview?url=https://example.com`

Returns JSON preview metadata.

### GET `/api/preview?url=https://example.com&format=html`

Returns a rendered HTML preview card.
