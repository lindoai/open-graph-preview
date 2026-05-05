import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseHTML } from 'linkedom';
import { readTurnstileTokenFromUrl, verifyTurnstileToken } from '../_shared/turnstile';
import { renderTextToolPage, turnstileSiteKeyFromEnv } from '../_shared/tool-page';

type Env = { Bindings: { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string } };

const app = new Hono<Env>();
app.use('/api/*', cors());
app.get('/', (c) => c.html(renderTextToolPage({ title: 'Open Graph Preview', description: 'Render a social preview from a page\'s Open Graph tags.', endpoint: '/api/preview', sample: '{ "title": "..." }', siteKey: turnstileSiteKeyFromEnv(c.env), buttonLabel: 'Preview', toolSlug: 'open-graph-preview' })));
app.get('/health', (c) => c.json({ ok: true }));
app.get('/api/preview', async (c) => {
  const captcha = await verifyTurnstileToken(c.env, readTurnstileTokenFromUrl(c.req.url), c.req.header('CF-Connecting-IP'));
  if (!captcha.ok) return c.json({ error: captcha.error }, 403);
  const normalized = normalizeUrl(c.req.query('url') ?? '');
  const format = (c.req.query('format') ?? 'json').toLowerCase();
  if (!normalized) return c.json({ error: 'A valid http(s) URL is required.' }, 400);
  const html = await fetchHtml(normalized);
  if (!html) return c.json({ error: 'Failed to fetch page.' }, 502);
  const { document } = parseHTML(html);
  const data = {
    title: meta(document, 'og:title', 'property') || document.title || '',
    description: meta(document, 'og:description', 'property') || meta(document, 'description'),
    image: meta(document, 'og:image', 'property'),
    siteName: meta(document, 'og:site_name', 'property'),
    url: meta(document, 'og:url', 'property') || normalized,
  };
  if (format === 'html') {
    return c.html(`<!doctype html><html><body style="margin:0;background:#0f172a;display:grid;place-items:center;min-height:100vh;font-family:system-ui"><div style="width:620px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)"><div style="height:320px;background:#e5e7eb;display:grid;place-items:center">${data.image ? `<img src="${data.image}" style="width:100%;height:100%;object-fit:cover"/>` : '<span style="color:#6b7280">No og:image</span>'}</div><div style="padding:20px"><div style="font-size:13px;color:#6b7280;margin-bottom:8px">${data.siteName || new URL(normalized).hostname}</div><div style="font-size:28px;font-weight:700;color:#111827;margin-bottom:10px">${escapeHtml(data.title)}</div><div style="font-size:16px;color:#4b5563;line-height:1.5">${escapeHtml(data.description)}</div></div></div></body></html>`);
  }
  return c.json({ inputUrl: normalized, ...data });
});

function meta(document: any, name: string, attr = 'name') { return document.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content') || ''; }
async function fetchHtml(url: string) { const r = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml' } }).catch(() => null); return r?.ok ? r.text() : null; }
function normalizeUrl(value: string): string | null { try { return new URL(value.startsWith('http') ? value : `https://${value}`).toString(); } catch { return null; } }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m)); }
export default app;
