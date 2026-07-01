// Build SVG diagrams and (optionally) rasterize a preview via Playwright.
import { writeFileSync, mkdirSync } from 'fs';
import { drawBoard, drawBreadboard, frame } from './scenery.mjs';
import { SCENES } from './scenes.mjs';

const OUT = new URL('../../public/diagrams/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const arg = process.argv[2];
const only = arg && !arg.startsWith('--') ? arg : null;
const ids = only ? [only] : Object.keys(SCENES);

function render(id) {
  const s = SCENES[id]();
  const bb = s.bb === false ? '' : drawBreadboard();
  return frame(bb + drawBoard() + s.fg);
}

for (const id of ids) {
  writeFileSync(OUT + id + '.svg', render(id));
  console.log('wrote', id + '.svg');
}

// preview rasterization: node build.mjs <id> --png  → /tmp/<id>.png
if (process.argv.includes('--png') && only) {
  const { chromium } = await import('playwright');
  const svg = render(only);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1266, height: 861 } });
  await page.setContent(`<!doctype html><body style="margin:0">${svg}</body>`, { waitUntil: 'networkidle' });
  await page.locator('svg').screenshot({ path: `/tmp/${only}.png` });
  await browser.close();
  console.log('preview → /tmp/' + only + '.png');
}
