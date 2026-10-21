import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

const pages = [
  ['2-class/matematika/primery/index.html', 'offline/primery.html'],
  ['2-class/matematika/razdatochnyy-material/index.html', 'offline/razdatochnyy-material.html']
];

function localFile(url) {
  if (!url || /^(?:[a-z]+:)?\/\//i.test(url)) return null;
  let p = url.split(/[?#]/)[0];
  if (base && (p === base || p.startsWith(base + '/'))) p = p.slice(base.length);
  p = p.replace(/^\/+/, '');
  return p ? path.join(dist, p) : null;
}

async function inlinePage(html) {
  const links = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)];
  for (const match of links) {
    const href = (match[0].match(/\bhref="([^"]+)"/) || [])[1];
    const file = localFile(href);
    if (!file) continue;
    try {
      const css = await readFile(file, 'utf8');
      html = html.replace(match[0], `<style>${css}</style>`);
    } catch {}
  }

  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi)];
  for (const match of scripts) {
    const file = localFile(match[1]);
    if (!file) continue;
    try {
      const js = await readFile(file, 'utf8');
      html = html.replace(match[0], `<script>${js}</script>`);
    } catch {}
  }

  return html
    .replace(/<a\b[^>]*\bdata-offline-hide\b[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<!--\s*Yandex\.Metrika counter\s*-->[\s\S]*?<!--\s*\/Yandex\.Metrika counter\s*-->/gi, '')
    .replace(/<script\b[^>]*\bdata-yandex-metrika\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[^>]*\bdata-yandex-metrika\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<meta\b[^>]*\bname="(?:robots|googlebot|yandex|bingbot)"[^>]*>/gi, '')
    .replace(/<link\b[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="icon"[^>]*>/gi, '')
    .replace('</head>', '<meta name="robots" content="noindex, nofollow"><style>.site-nav,.site-top,.site-scrim{display:none!important}</style></head>');
}

for (const [src, out] of pages) {
  const html = await readFile(path.join(dist, src), 'utf8');
  const standalone = await inlinePage(html);
  const target = path.join(dist, out);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, standalone, 'utf8');
  console.log(`offline: ${out} (${Buffer.byteLength(standalone)} bytes)`);
}
