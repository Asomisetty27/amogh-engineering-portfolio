// Generates one crawlable static page per project (public/teardown/p/<slug>/index.html) from the
// PROJECTS / DETAIL data in public/teardown/index.html, plus public/sitemap.xml. The teardown page
// stays the interactive home; these pages give search engines and outreach links a real URL per
// project. Run after any change to project data:  node scripts/build-project-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://www.amogh.site';
const src = fs.readFileSync(path.join(ROOT, 'public/teardown/index.html'), 'utf8');

const cut = (start, end) => { const a = src.indexOf(start); const b = src.indexOf(end, a) + end.length; return src.slice(a, b); };
const ctx = {};
vm.runInNewContext(`${cut('const CATS', '\n];')}\n${cut('const PROJECTS', '\n];')}\n${cut('const DETAIL', '\n};')}\nthis.out = { CATS, PROJECTS, DETAIL };`, ctx);
const { CATS, PROJECTS, DETAIL } = ctx.out;

const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const esc = s => strip(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const slug = p => p.name.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const today = new Date().toISOString().slice(0, 10);
const asset = u => (u && !/^https?:/.test(u) ? `/teardown/${u.replace(/^\.?\//, '')}` : u);

const outDir = path.join(ROOT, 'public/teardown/p');
fs.rmSync(outDir, { recursive: true, force: true });
const urls = [];

PROJECTS.forEach((p, i) => {
  const d = DETAIL[p.id] || {}, cat = CATS.find(c => c.id === p.cat) || { name: '' };
  const s = slug(p), url = `${SITE}/teardown/p/${s}/`;
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
  const built = d.built || p.facts;
  const desc = `${strip(p.sub)}. ${strip((d.problem ? built[0] : p.facts[0]) || '')}`.slice(0, 300);
  const img = asset(d.img || (d.photos && d.photos[0] && d.photos[0][0]) || (d.illus && d.illus[0])) || '/teardown/og.jpg';
  const spec = [['Area', cat.name], ['Role', d.role], ['Context', p.ctx], ['Team', d.team], ['Dates', p.when], ['Status', p.status], ['Tools', d.tools || p.tags.join(', ')]].filter(r => r[1]);
  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.name, headline: `${p.name}: ${strip(p.sub)}`, description: desc, url, image: SITE + img,
    author: { '@type': 'Person', name: 'Amogh Somisetty', url: `${SITE}/teardown/` }, keywords: p.tags.join(', ') };
  const photos = (d.photos || []).map(([src2, cap]) => `<figure><img src="${asset(src2)}" alt="${esc(cap)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`).join('');
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.name)}: ${esc(p.sub)} · Amogh Somisetty</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.name)}: ${esc(p.sub)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}${img}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
:root{--ink:#101318;--muted:#5A6371;--paper:#F3F4F6;--card:#fff;--hair:#D8DCE2;--accent:#F2571B;--display:"Instrument Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 var(--display);-webkit-font-smoothing:antialiased}
a{color:inherit}.wrap{max-width:820px;margin:0 auto;padding:28px 20px 80px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:14px}
.top a{text-decoration:none}.pill{display:inline-block;border:1px solid var(--hair);background:var(--card);border-radius:999px;padding:8px 14px;font-weight:500;text-decoration:none}
.pill.dark{background:var(--ink);color:#fff;border-color:var(--ink)}
.crumb{font:12px var(--mono);color:var(--muted);margin:40px 0 6px;letter-spacing:.04em}
h1{font-size:clamp(34px,6vw,52px);line-height:1.05;letter-spacing:-.02em;margin:0}.sub{font-size:20px;color:var(--muted);margin:8px 0 24px}
.status{display:inline-block;font:12px var(--mono);border:1px solid var(--hair);border-radius:999px;padding:4px 10px;margin-bottom:14px}
dl{display:grid;grid-template-columns:110px 1fr;gap:6px 14px;background:var(--card);border:1px solid var(--hair);border-radius:12px;padding:18px;margin:0 0 28px}
dt{font:12px var(--mono);color:var(--muted);text-transform:uppercase;padding-top:2px}dd{margin:0}
h2{font-size:20px;margin:32px 0 8px}ul{padding-left:20px}li{margin:6px 0}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.metrics div{background:var(--card);border:1px solid var(--hair);border-radius:12px;padding:14px}
.metrics b{display:block;font-size:22px}.metrics span{color:var(--muted);font-size:14px}
figure{margin:0 0 16px}figure img{width:100%;border-radius:12px;border:1px solid var(--hair);background:#fff}figcaption{font-size:13px;color:var(--muted);margin-top:6px}
.cta{margin:36px 0;display:flex;gap:10px;flex-wrap:wrap}.nav{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--hair);padding-top:18px;font-size:14px}
.tags span{display:inline-block;font:12px var(--mono);border:1px solid var(--hair);border-radius:6px;padding:3px 8px;margin:0 6px 6px 0;background:var(--card)}
@media (max-width:520px){dl{grid-template-columns:1fr}dt{padding-top:8px}}
</style></head>
<body><div class="wrap">
<header class="top"><a href="/teardown/"><b>Amogh Somisetty</b> · Electrical Engineering, Cal Poly</a>
<span><a class="pill" href="/teardown/#projects">All projects</a> <a class="pill dark" href="/teardown/resume.pdf">Resume</a></span></header>
<main>
<div class="crumb">${esc(cat.name).toUpperCase()} · ${p.id}</div>
<div class="status">${esc(p.status)}</div>
<h1>${esc(p.name)}</h1><p class="sub">${esc(p.sub)}</p>
<dl>${spec.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
${d.problem ? `<h2>The problem</h2><p>${esc(d.problem)}</p>` : ''}
<h2>${d.problem ? 'What I built' : 'Overview'}</h2><ul>${built.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
${d.img ? `<figure><img src="${asset(d.img)}" alt="${esc(p.name)}, ray-traced render" loading="lazy">${d.figCap ? `<figcaption>${esc(d.figCap)}</figcaption>` : ''}</figure>` : ''}
${photos ? `<h2>${esc(d.shotsTitle || 'On the bench')}</h2>${photos}` : ''}
${d.results ? `<h2>Results</h2><div class="metrics">${d.results.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
${d.learned ? `<h2>What I learned</h2><p>${esc(d.learned)}</p>` : ''}
${p.links ? `<h2>Links</h2><p>${p.links.map(([l, u]) => `<a href="${u}" rel="noopener">${esc(l)}</a>`).join(' · ')}</p>` : ''}
<p class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>
<div class="cta"><a class="pill dark" href="/teardown/#d-${p.id}">Open the interactive datasheet</a><a class="pill" href="mailto:somisett@calpoly.edu">Email me</a></div>
</main>
<nav class="nav"><a href="/teardown/p/${slug(prev)}/">← ${esc(prev.name)}</a><a href="/teardown/p/${slug(next)}/">${esc(next.name)} →</a></nav>
</div></body></html>
`;
  fs.mkdirSync(path.join(outDir, s), { recursive: true });
  fs.writeFileSync(path.join(outDir, s, 'index.html'), html);
  urls.push([url, p.flagship ? '0.8' : '0.6']);
});

// index of all project pages (also crawlable)
fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projects · Amogh Somisetty</title><meta name="description" content="Every project by Amogh Somisetty, Cal Poly electrical engineering: GPU reliability research, hardware design, vision and ML, software, and work.">
<link rel="canonical" href="${SITE}/teardown/p/"><style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:0 auto;padding:28px 20px;color:#101318}a{color:inherit}li{margin:6px 0}</style></head>
<body><p><a href="/teardown/">← Amogh Somisetty</a></p><h1>Projects</h1>${CATS.filter(c => PROJECTS.some(p => p.cat === c.id)).map(c => `<h2>${esc(c.name)}</h2><ul>${PROJECTS.filter(p => p.cat === c.id).map(p => `<li><a href="/teardown/p/${slug(p)}/">${esc(p.name)}</a>: ${esc(p.sub)}</li>`).join('')}</ul>`).join('')}</body></html>
`);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/teardown/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/teardown/hire/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/teardown/p/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
${urls.map(([u, pr]) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${pr}</priority></url>`).join('\n')}
  <url><loc>${SITE}/thermalos</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${SITE}/thermalos/fleet</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'public/sitemap.xml'), sitemap);
console.log(`wrote ${urls.length} project pages + index + sitemap`);
