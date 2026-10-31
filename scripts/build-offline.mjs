import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

const pages = [
  ['2-class/matematika/primery/index.html', 'offline/primery.html'],
  ['2-class/matematika/razdatochnyy-material/index.html', 'offline/razdatochnyy-material.html'],
  ['en/grade-2/math/practice/index.html', 'offline/en-practice.html'],
  ['en/grade-2/math/worksheets/index.html', 'offline/en-worksheets.html'],
  ['2-class/matematika/razryady/index.html', 'offline/razryady.html'],
  ['2-class/matematika/sravnenie/index.html', 'offline/sravnenie.html'],
  ['2-class/matematika/skobki/index.html', 'offline/skobki.html'],
  ['2-class/matematika/velichiny/index.html', 'offline/velichiny.html'],
  ['2-class/matematika/perimetr/index.html', 'offline/perimetr.html'],
  ['en/grade-2/math/place-value/index.html', 'offline/en-place-value.html'],
  ['en/grade-2/math/comparison/index.html', 'offline/en-comparison.html'],
  ['en/grade-2/math/brackets/index.html', 'offline/en-brackets.html'],
  ['en/grade-2/math/units/index.html', 'offline/en-units.html'],
  ['en/grade-2/math/perimeter/index.html', 'offline/en-perimeter.html'],
  ['2-class/matematika/zadachi/index.html', 'offline/zadachi.html'],
  ['2-class/matematika/lomanye/index.html', 'offline/lomanye.html'],
  ['en/grade-2/math/word-problems/index.html', 'offline/en-word-problems.html'],
  ['en/grade-2/math/polylines/index.html', 'offline/en-polylines.html'],
  ['2-class/matematika/uravneniya/index.html', 'offline/uravneniya.html'],
  ['2-class/matematika/delenie-s-ostatkom/index.html', 'offline/delenie-s-ostatkom.html'],
  ['2-class/matematika/ploshchad-i-obem/index.html', 'offline/ploshchad-i-obem.html'],
  ['2-class/matematika/operacii-i-algoritmy/index.html', 'offline/operacii-i-algoritmy.html'],
  ['2-class/matematika/delimost/index.html', 'offline/delimost.html'],
  ['2-class/matematika/geometriya/index.html', 'offline/geometriya.html'],
  ['2-class/matematika/tysyacha/index.html', 'offline/tysyacha.html'],
  ['2-class/matematika/kruglye-chisla/index.html', 'offline/kruglye-chisla.html'],
  ['2-class/matematika/derevo-vozmozhnostey/index.html', 'offline/derevo-vozmozhnostey.html'],
  ['en/grade-2/math/equations/index.html', 'offline/en-equations.html'],
  ['en/grade-2/math/remainders/index.html', 'offline/en-remainders.html'],
  ['en/grade-2/math/area-and-volume/index.html', 'offline/en-area-and-volume.html'],
  ['en/grade-2/math/operations-and-algorithms/index.html', 'offline/en-operations-and-algorithms.html'],
  ['en/grade-2/math/divisibility/index.html', 'offline/en-divisibility.html'],
  ['en/grade-2/math/geometry/index.html', 'offline/en-geometry.html'],
  ['en/grade-2/math/three-digit-numbers/index.html', 'offline/en-three-digit-numbers.html'],
  ['en/grade-2/math/round-numbers/index.html', 'offline/en-round-numbers.html'],
  ['en/grade-2/math/tree-of-possibilities/index.html', 'offline/en-tree-of-possibilities.html']
];

const problemsImgDir = path.join(publicDir, 'img', 'problems');
let problemsImgScript = '';
if (existsSync(problemsImgDir)) {
  const files = readdirSync(problemsImgDir).filter((f) => f.endsWith('.webp'));
  const map = {};
  for (const file of files) {
    const data = await readFile(path.join(problemsImgDir, file));
    map[file.replace(/\.webp$/, '')] = `data:image/webp;base64,${data.toString('base64')}`;
  }
  problemsImgScript = `<script>window.__PROBLEM_IMG__=${JSON.stringify(map)}</script>`;
}

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
    .replace('</head>', problemsImgScript + '<meta name="robots" content="noindex, nofollow"><style>.site-nav,.site-top,.site-scrim{display:none!important}</style></head>');
}

for (const [src, out] of pages) {
  const html = await readFile(path.join(dist, src), 'utf8');
  const standalone = await inlinePage(html);
  // dist/offline for the built site; public/offline so `astro dev` serves the same files.
  for (const dir of [dist, publicDir]) {
    const target = path.join(dir, out);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, standalone, 'utf8');
  }
  console.log(`offline: ${out} (${Buffer.byteLength(standalone)} bytes)`);
}
