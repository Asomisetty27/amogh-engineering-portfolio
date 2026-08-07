// Tailscore data layer. Read-only REST reads against the pipeline's public
// anon endpoint. Plain fetch, no SDK, no writes.

const BASE = "https://rvrlgldszskywgoptnjq.supabase.co/rest/v1";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cmxnbGRzenNreXdnb3B0bmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjQ4ODUsImV4cCI6MjEwMTYwMDg4NX0.D4zOJ9QphnJWpUAc_xhi3igE7ZAIKEnj_8qSdPD6HtM";

export type PlayTag = "TAIL" | "LEAN" | "PASS" | "STALE" | "FADE";

export interface PlayCapper {
  name: string;
  score: number;
}

export interface Play {
  play_key: string;
  board_date: string;
  description: string;
  capper: string;
  consensus_count: number;
  play_score: number;
  tag: PlayTag;
  stake_units: number | null;
  posted_at: string;
  corroborated: boolean;
  // spread | moneyline | total | player_prop | team_prop | other; null on stale rows
  market_type?: string | null;
  // every capper riding the play, posting order (first entry posted it first)
  cappers?: PlayCapper[];
}

export interface Capper {
  capper: string;
  monthly_price_usd: number | null;
  score: number;
  n_graded: number;
  wins: number;
  losses: number;
  pushes: number;
  flat_pl: number;
  units_calibration: number | null;
  updated_at: string;
  // closing line value, populated by the pipeline as live capture matures
  clv?: number | null;
}

export interface LedgerRow {
  capper: string;
  posted_at: string;
  description: string;
  market_type: string | null;
  sport: string | null;
  result: "win" | "loss" | "push" | "void";
  profit_units: number | null;
  odds_american: number | null;
  settled_by: string | null;
}

export interface Totals {
  picks?: number;
  graded?: number;
  cappers?: number;
  feed_signals?: number;
}

// Weights are fractions of bankroll. The bankroll itself never reaches the
// pipeline, so personalization is a multiplication done here in the browser.
export interface PortfolioPlay {
  day: string;
  pick_id: string;
  play_key: string;
  description: string;
  market_type: string | null;
  play_score: number;
  odds_american: number;
  weight: number;
  tag: PlayTag | null;
  cappers: PlayCapper[];
  commence_time: string | null;
}

export interface PortfolioLedgerRow {
  day: string;
  allocated_count: number;
  total_weight: number;
  realized_return: number | null;
  cumulative_return: number | null;
}

export interface Meta {
  lastSync: string | null;
  totals: Totals;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export interface Snapshot {
  plays: Play[];
  cappers: Capper[];
  meta: Meta;
}

export async function fetchSnapshot(): Promise<Snapshot> {
  const [plays, cappers, metaRows] = await Promise.all([
    get<Play[]>("/board_live?select=*&order=play_score.desc"),
    get<Capper[]>("/capper_board?select=*&order=score.desc"),
    get<{ k: string; v: Record<string, unknown> }[]>("/site_meta?select=*"),
  ]);
  const byKey = new Map(metaRows.map((r) => [r.k, r.v]));
  const sync = byKey.get("last_sync") as { at?: string } | undefined;
  return {
    plays,
    cappers,
    meta: {
      lastSync: sync?.at ?? null,
      totals: (byKey.get("totals") as Totals) ?? {},
    },
  };
}

// receipts are heavy (up to 4000 rows), so they load once in the background
// after first paint and are cached for the session
let ledgerCache: Promise<LedgerRow[]> | null = null;

export function fetchLedger(): Promise<LedgerRow[]> {
  if (!ledgerCache) {
    ledgerCache = get<LedgerRow[]>(
      "/capper_ledger?select=*&order=posted_at.desc&limit=4000",
    ).catch((e) => {
      ledgerCache = null; // allow retry on next open
      throw e;
    });
  }
  return ledgerCache;
}

export async function fetchPortfolio(): Promise<{
  plays: PortfolioPlay[];
  ledger: PortfolioLedgerRow[];
}> {
  const [plays, ledger] = await Promise.all([
    get<PortfolioPlay[]>("/portfolio_today?select=*&order=weight.desc"),
    get<PortfolioLedgerRow[]>("/portfolio_ledger?select=*&order=day"),
  ]);
  return { plays, ledger };
}

/** Stake rounding a bettor would actually use: dollars up to 200, then fives. */
export function roundStake(dollars: number): number {
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return dollars < 200 ? Math.round(dollars) : Math.round(dollars / 5) * 5;
}

export const fmtMoney = (n: number) =>
  `$${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const fmtPct = (frac: number, digits = 2) => `${(frac * 100).toFixed(digits)}%`;

// ── formatting helpers ──────────────────────────────────────────────────────
export function relTime(iso: string | null): string {
  if (!iso) return "unknown";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const fmtScore = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "-");
export const fmtSigned = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(2)}u`;
