#!/usr/bin/env node
/**
 * DESIGN VERIFIER - the machine-checkable half of the design goal anchor in
 * CLAUDE.md ("Design goal anchor" section). Run via `npm run design:verify`
 * after a build. Any gate failure = the change does NOT ship (see ROLLBACK
 * in CLAUDE.md). Gates are calibrated to pass on the current design system;
 * if you loosen a threshold, say why in the commit message.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { gzipSync } from "zlib";
import { join, relative } from "path";

const ROOT = process.cwd();
const results = [];
const gate = (id, name, pass, detail) => {
  results.push({ id, name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}  ${name}${detail ? `  - ${detail}` : ""}`);
};

// ── collect src files ──────────────────────────────────────────────────────
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}
const srcFiles = walk(join(ROOT, "src"));
const read = (p) => readFileSync(p, "utf8");

// ── G1: zero em dashes anywhere in src (house copy rule) ──────────────────
{
  const hits = srcFiles.flatMap((p) =>
    read(p).includes("—") ? [relative(ROOT, p)] : [],
  );
  gate("G1", "no em dashes in src", hits.length === 0, hits.slice(0, 5).join(", "));
}

// ── G2: banned ambient components never imported (Isotherm: restraint) ────
{
  const BANNED = /from\s+["'][^"']*(GradientOrbs|FilmGrain|ParticleField)["']/;
  const hits = srcFiles.filter(
    (p) => !/GradientOrbs|FilmGrain|ParticleField/.test(p) && BANNED.test(read(p)),
  );
  gate("G2", "banned ambient layers (orbs/grain/particles) not imported", hits.length === 0,
    hits.map((p) => relative(ROOT, p)).join(", "));
}

// ── G3: backdrop-filter only where already licensed ────────────────────────
// Isotherm: machined surfaces, not glass. The nav + legacy thermalos pages
// keep their existing usage; NEW files may not introduce it.
{
  const WHITELIST = new Set([
    "src/index.css",
    "src/components/MissionNav.tsx",
    "src/pages/thermalos/ResearchLanding.tsx",
    "src/pages/thermalos/FleetDashboard.tsx",
    "src/pages/thermalos/components/GPUHeroScene.tsx",
    "src/pages/thermalos/components/DataCenterScene.tsx",
  ]);
  const hits = srcFiles.filter(
    (p) => /backdrop-?[fF]ilter/.test(read(p)) && !WHITELIST.has(relative(ROOT, p)),
  );
  gate("G3", "backdrop-filter confined to whitelist", hits.length === 0,
    hits.map((p) => relative(ROOT, p)).join(", "));
}

// ── G4: banned buzzwords in copy (evidence-grade register) ─────────────────
{
  const BUZZ = /\b(seamless(ly)?|cutting[- ]edge|synergy|world[- ]class|revolutionary|game[- ]chang\w*|paradigm)\b/i;
  const hits = [];
  for (const p of srcFiles) {
    const m = read(p).match(BUZZ);
    if (m) hits.push(`${relative(ROOT, p)} ("${m[0]}")`);
  }
  gate("G4", "no marketing buzzwords in src copy", hits.length === 0, hits.slice(0, 5).join(", "));
}

// ── G5: bundle budgets (gzip) ──────────────────────────────────────────────
{
  const distDir = join(ROOT, "dist", "assets");
  if (!existsSync(distDir)) {
    gate("G5", "bundle budgets", false, "dist/assets missing - run the build first");
  } else {
    const sizes = readdirSync(distDir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => ({ f, gz: gzipSync(readFileSync(join(distDir, f))).length / 1024 }));
    // The real entry is whatever dist/index.html loads, not a filename guess.
    const html = readFileSync(join(ROOT, "dist", "index.html"), "utf8");
    const entryName = (html.match(/src="\/assets\/([^"]+\.js)"/) || [])[1];
    const entry = sizes.find((s) => s.f === entryName);
    const total = sizes.reduce((a, s) => a + s.gz, 0);
    const biggest = sizes.reduce((a, s) => (s.gz > a.gz ? s : a), { gz: 0 });
    const ok =
      entry && entry.gz <= 160 && biggest.gz <= 260 && total <= 950;
    gate("G5", "bundle budgets (entry<=160KB, chunk<=260KB, total<=950KB gz)", !!ok,
      `entry=${entry ? entry.gz.toFixed(1) : "?"}KB, max=${biggest.f} ${biggest.gz.toFixed(1)}KB, total=${total.toFixed(0)}KB`);
  }
}

// ── G6: runtime sweep - every routed page, two viewports ───────────────────
const { preview } = await import("vite");
const { chromium } = await import("@playwright/test");
{
  const server = await preview({ preview: { port: 4181 } });
  const browser = await chromium.launch();
  const ROUTES = ["/", "/projects", "/experience", "/skills", "/contact", "/quickview", "/thermalos"];
  let errors = [];
  let hscroll = [];
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: vp });
    page.on("console", (m) => { if (m.type() === "error") errors.push(`${vp.width}px ${page.url()}: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`${vp.width}px ${page.url()}: ${e}`));
    for (const r of ROUTES) {
      await page.goto(`http://localhost:4181${r}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (wide) hscroll.push(`${vp.width}px ${r}`);
    }
    await page.close();
  }
  await browser.close();
  await server.close();
  gate("G6a", "zero console/page errors across all routes x 2 viewports", errors.length === 0, errors.slice(0, 3).join(" | "));
  gate("G6b", "no horizontal scroll on any route", hscroll.length === 0, hscroll.join(", "));
}

// ── verdict ────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.pass);
console.log("");
if (failed.length) {
  console.log(`DESIGN VERIFY: FAIL (${failed.length} gate${failed.length > 1 ? "s" : ""})`);
  console.log("ROLLBACK: do not commit. Fix or revert the working tree.");
  console.log("If already committed: revert the commit. If pushed: push the revert.");
  process.exit(1);
} else {
  console.log("DESIGN VERIFY: PASS (all gates)");
}
