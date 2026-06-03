// Routing — single source of truth for the two INDEPENDENT brands.
//
//   ISOTHERM  — the startup / company. Customer-facing product.
//     /isotherm          -> Landing (marketing)
//     /isotherm/fleet    -> Fleet Dashboard (the product)
//
//   THERMALOS — the research & academic project. The science.
//     /thermalos          -> research hub (Overview)
//     /thermalos/<page>   -> findings, lab, advisor, publication, yc, roadmap…
//
// Two names, two faces of the same work: Isotherm sells the product, ThermalOS
// is the research identity (papers, advisors, Stage-1 findings). Each zone has
// its own base constant so either can move to a dedicated domain (isotherm.io /
// thermalos.org) by editing one line. No other file hardcodes these paths.

// ── Brand 1: ISOTHERM (startup) ──────────────────────────────────────────────
export const SITE_BASE = '/isotherm';
export const FLEET_BASE = '/isotherm/fleet';

// ── Brand 2: THERMALOS (research) ────────────────────────────────────────────
export const RESEARCH_BASE = '/thermalos';

/** Isotherm (startup) path, e.g. sitePath() -> '/isotherm'. */
export const sitePath = (p = ''): string =>
  p ? `${SITE_BASE}/${p.replace(/^\/+/, '')}` : SITE_BASE;

/** ThermalOS (research) path, e.g. researchPath('lab') -> '/thermalos/lab'. */
export const researchPath = (p = ''): string =>
  p ? `${RESEARCH_BASE}/${p.replace(/^\/+/, '')}` : RESEARCH_BASE;

// Research-hub inner route segments. The methodology page is "findings".
export const RESEARCH_SEGMENTS = [
  'findings', 'lab', 'roadmap', 'advisor', 'publication',
  'yc', 'command', 'dashboard', 'plan', 'entry',
] as const;

// Redirects from superseded URLs to their new home.
export const LEGACY_REDIRECTS: Record<string, string> = {
  // old marketing/product URLs → Isotherm
  '/landing': sitePath(),
  '/thermalos/fleet': `${SITE_BASE}/fleet`,
  // old app shell + flat methodology link → ThermalOS research hub
  '/thermalos/app': researchPath(),
  '/thermalos/research': researchPath('findings'),
};
