// ThermalOS routing — single source of truth.
//
// MIGRATION: To move ThermalOS to its own domain (e.g. thermalos.com), set:
//     export const SITE_BASE = '';        // landing served at "/"
//     export const APP_BASE  = '/app';    // dashboard served at "/app"
// Every internal link derives from these two constants, so the whole subsite
// relocates by editing this file alone. No other code references hardcoded
// "/thermalos" paths.

export const SITE_BASE = '/thermalos';
export const APP_BASE = '/thermalos/app';

/** Build a dashboard path, e.g. appPath('research') -> '/thermalos/app/research'. */
export const appPath = (p = ''): string =>
  p ? `${APP_BASE}/${p.replace(/^\/+/, '')}` : APP_BASE;

/** Build a public-site path, e.g. sitePath() -> '/thermalos'. */
export const sitePath = (p = ''): string =>
  p ? `${SITE_BASE}/${p.replace(/^\/+/, '')}` : SITE_BASE;

// In-app route segments — used to generate both the live routes and the
// legacy redirect map (old /thermalos/<seg> -> /thermalos/app/<seg>).
export const APP_SEGMENTS = [
  'research', 'lab', 'roadmap', 'advisor', 'publication',
  'yc', 'command', 'dashboard', 'plan', 'entry',
  'live', 'experiments', 'cycling', 'alerts', 'model',
  'tim', 'evidence', 'predictions', 'outreach', 'today', 'timeline',
] as const;
