// Personalized daily allocation. The pipeline publishes weights as fractions of
// bankroll; the bankroll lives in the signed-in user's own RLS-locked row, so the
// dollar figures below are computed here in the browser and nowhere else.
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PortfolioLedgerRow, PortfolioPlay, fetchPortfolio, fmtMoney, fmtPct, fmtScore,
  roundStake,
} from "./api";
import { Profile, Session, getSession, loadProfile, saveProfile, signIn, signOut } from "./auth";
import {
  BG, BODY, DIM, DISPLAY, EASE, EMERALD, FAINT, FG, GRAY, LABEL, LINE, LINE_2, MONO,
  NUM, PANEL, PANEL_2, RED, SectionHead, TAG_COLOR, WRAP, scoreColor,
} from "./ui";

const BOOKS = [
  "DraftKings", "FanDuel", "BetMGM", "Caesars", "ESPN BET",
  "Fanatics", "PrizePicks", "Underdog", "Other",
];

const card: React.CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 6,
  padding: 18,
};

const inputStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 13,
  color: FG,
  background: PANEL_2,
  border: `1px solid ${LINE_2}`,
  borderRadius: 4,
  padding: "9px 11px",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  ...LABEL,
  fontSize: 10,
  letterSpacing: "0.16em",
  color: BG,
  background: EMERALD,
  border: "none",
  borderRadius: 4,
  padding: "10px 16px",
  cursor: "pointer",
};

// ── accountability curve ────────────────────────────────────────────────────
const ReturnCurve: React.FC<{ ledger: PortfolioLedgerRow[] }> = ({ ledger }) => {
  const pts = ledger.filter((r) => r.cumulative_return != null);
  if (pts.length < 2) {
    return (
      <p style={{ fontFamily: BODY, fontSize: 13, color: FAINT, margin: 0 }}>
        The curve starts once a full day of allocations has settled.
      </p>
    );
  }
  const W = 640;
  const H = 120;
  const values = pts.map((r) => r.cumulative_return ?? 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 0.01;
  const x = (i: number) => (i / (pts.length - 1)) * (W - 8) + 4;
  const y = (v: number) => H - 12 - ((v - min) / span) * (H - 26);
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 120, display: "block" }}
        role="img"
        aria-label={`Cumulative paper return ${fmtPct(last)}`}
      >
        <line x1={4} x2={W - 4} y1={y(0)} y2={y(0)} stroke={LINE_2} strokeDasharray="3 4" strokeWidth={1} />
        <motion.polyline
          points={line}
          fill="none"
          stroke={last >= 0 ? EMERALD : RED}
          strokeWidth={1.6}
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
        <span style={{ ...NUM, fontSize: 15, color: last >= 0 ? EMERALD : RED }}>
          {last >= 0 ? "+" : ""}{fmtPct(last)}
        </span>
        <span style={{ ...LABEL, color: FAINT }}>
          cumulative, {pts.length} settled days
        </span>
      </div>
      <p style={{ fontFamily: BODY, fontSize: 12, color: FAINT, margin: "10px 0 0", lineHeight: 1.5 }}>
        Paper traded at the odds the capper posted, flat against the published weights.
        Your own fills will differ.
      </p>
    </div>
  );
};

// ── one allocation row ──────────────────────────────────────────────────────
const AllocationRow: React.FC<{
  play: PortfolioPlay;
  bankroll: number | null;
  index: number;
}> = ({ play, bankroll, index }) => {
  const color = play.tag ? TAG_COLOR[play.tag] ?? GRAY : GRAY;
  const dollars = bankroll ? roundStake(bankroll * play.weight) : null;
  const lead = play.cappers[0];
  const why = [
    `score ${fmtScore(play.play_score)}`,
    play.cappers.length > 1 ? `${play.cappers.length} cappers agree` : lead ? "single source" : null,
  ].filter(Boolean).join(", ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24), ease: [0.16, 1, 0.3, 1] }}
      style={{
        ...card,
        borderLeft: `2px solid ${color}`,
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div style={{ fontFamily: BODY, fontSize: 15, color: FG, marginBottom: 6 }}>
          {play.description}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {play.cappers.slice(0, 3).map((c) => (
            <span key={c.name} style={{ ...LABEL, color: DIM, letterSpacing: "0.08em" }}>
              {c.name}{" "}
              <span style={{ ...NUM, fontSize: 11, color: scoreColor(c.score) }}>
                {fmtScore(c.score)}
              </span>
            </span>
          ))}
          {play.cappers.length > 3 && (
            <span style={{ ...LABEL, color: FAINT }}>+{play.cappers.length - 3}</span>
          )}
        </div>
        <div style={{ ...LABEL, color: FAINT, marginTop: 6, letterSpacing: "0.08em" }}>
          {why}
        </div>
      </div>

      <div style={{ textAlign: "right", minWidth: 108 }}>
        <div style={{ ...NUM, fontSize: 22, fontWeight: 600, color: FG, letterSpacing: "-0.02em" }}>
          {dollars != null ? fmtMoney(dollars) : fmtPct(play.weight)}
        </div>
        <div style={{ ...LABEL, color: FAINT, marginTop: 4 }}>
          {dollars != null ? `${fmtPct(play.weight)} of roll` : "set a bankroll"}
        </div>
        <div style={{ ...NUM, fontSize: 12, color: DIM, marginTop: 6 }}>
          {play.odds_american > 0 ? `+${play.odds_american}` : play.odds_american}
        </div>
      </div>
    </motion.div>
  );
};

// ── signed-out gate ─────────────────────────────────────────────────────────
const SignIn: React.FC<{ onSession: (s: Session) => void }> = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setError(null);
    const err = await signIn(email.trim());
    if (err) {
      setError(err);
      setState("idle");
    } else {
      setState("sent");
    }
  };

  return (
    <div style={{ ...card, maxWidth: 560 }}>
      <div style={{ ...LABEL, color: EMERALD, marginBottom: 10 }}>Sign in</div>
      <p style={{ fontFamily: BODY, fontSize: 14, color: DIM, lineHeight: 1.55, margin: "0 0 16px" }}>
        Enter your bankroll once and the daily allocation converts from percentages
        into dollar amounts. Your bankroll is stored against your account only, and
        no one else can read it.
      </p>
      {state === "sent" ? (
        <p style={{ fontFamily: BODY, fontSize: 14, color: EMERALD, margin: 0 }}>
          Check your email. The link signs you in and returns you here.
        </p>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            style={{ ...inputStyle, flex: "1 1 220px", minWidth: 0 }}
          />
          <button type="submit" style={buttonStyle} disabled={state === "sending"}>
            {state === "sending" ? "Sending" : "Get magic link"}
          </button>
        </form>
      )}
      {error && (
        <p style={{ fontFamily: BODY, fontSize: 13, color: RED, margin: "10px 0 0" }}>{error}</p>
      )}
    </div>
  );
};

// ── settings ────────────────────────────────────────────────────────────────
const Settings: React.FC<{
  session: Session;
  profile: Profile;
  onProfile: (p: Profile) => void;
  onSignOut: () => void;
}> = ({ session, profile, onProfile, onSignOut }) => {
  const [draft, setDraft] = useState(profile.bankroll != null ? String(profile.bankroll) : "");
  const [saved, setSaved] = useState(false);

  const persist = useCallback(async (next: Profile) => {
    onProfile(next);
    setSaved(await saveProfile(session, next));
    window.setTimeout(() => setSaved(false), 2200);
  }, [onProfile, session]);

  const commitBankroll = () => {
    const value = Number(draft.replace(/[^0-9.]/g, ""));
    persist({ ...profile, bankroll: Number.isFinite(value) && value > 0 ? value : null });
  };

  const toggleBook = (book: string) => {
    const has = profile.books.includes(book);
    persist({
      ...profile,
      books: has ? profile.books.filter((b) => b !== book) : [...profile.books, book],
    });
  };

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label htmlFor="ts-bankroll" style={{ ...LABEL, display: "block", marginBottom: 8 }}>
            Bankroll
          </label>
          <input
            id="ts-bankroll"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitBankroll}
            onKeyDown={(e) => { if (e.key === "Enter") commitBankroll(); }}
            placeholder="1000"
            style={{ ...inputStyle, width: 140 }}
          />
        </div>
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ ...LABEL, marginBottom: 8 }}>Books you use</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BOOKS.map((b) => {
              const on = profile.books.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBook(b)}
                  aria-pressed={on}
                  className="ts-press"
                  style={{
                    ...LABEL,
                    fontSize: 9.5,
                    letterSpacing: "0.12em",
                    color: on ? BG : DIM,
                    background: on ? EMERALD : "transparent",
                    border: `1px solid ${on ? EMERALD : LINE}`,
                    borderRadius: 999,
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          {saved && <span style={{ ...LABEL, color: EMERALD }}>Saved</span>}
          <button
            type="button"
            onClick={onSignOut}
            style={{ ...LABEL, color: FAINT, background: "transparent", border: "none", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </div>
      <p style={{ fontFamily: BODY, fontSize: 12, color: FAINT, margin: "14px 0 0", lineHeight: 1.5 }}>
        Books are recorded so the allocation can flag prices you cannot reach. Odds
        move between books and lines get pulled, so treat every number as the price
        at posting time, not a guarantee.
      </p>
    </div>
  );
};

// ── section ─────────────────────────────────────────────────────────────────
const Portfolio: React.FC = () => {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [profile, setProfile] = useState<Profile>({ books: [], bankroll: null });
  const [plays, setPlays] = useState<PortfolioPlay[]>([]);
  const [ledger, setLedger] = useState<PortfolioLedgerRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPortfolio()
      .then(({ plays: p, ledger: l }) => {
        if (!alive) return;
        setPlays(p);
        setLedger(l);
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    loadProfile(session).then((p) => { if (alive && p) setProfile(p); });
    return () => { alive = false; };
  }, [session]);

  const totalWeight = useMemo(
    () => plays.reduce((sum, p) => sum + p.weight, 0),
    [plays],
  );
  const totalDollars = profile.bankroll ? roundStake(profile.bankroll * totalWeight) : null;

  return (
    <section id="portfolio" style={{ ...WRAP, paddingTop: 64 }}>
      <SectionHead
        index="02"
        sub="Daily allocation"
        title="Portfolio"
        right={
          <span style={{ ...LABEL, color: FAINT }}>
            {loaded ? `${plays.length} allocated / ${fmtPct(totalWeight, 1)} exposure` : "loading"}
          </span>
        }
      />

      {!session ? (
        <SignIn onSession={setSession} />
      ) : (
        <Settings
          session={session}
          profile={profile}
          onProfile={setProfile}
          onSignOut={() => { signOut(); setSession(null); }}
        />
      )}

      {loaded && plays.length === 0 && (
        <div style={{ ...card, borderLeft: `2px solid ${GRAY}`, marginTop: session ? 0 : 20 }}>
          <div style={{ ...LABEL, color: DIM, marginBottom: 8 }}>Sit day</div>
          <p style={{ fontFamily: BODY, fontSize: 15, color: FG, margin: 0, lineHeight: 1.5 }}>
            No allocation today. The board did not clear the bar.
          </p>
          <p style={{ fontFamily: BODY, fontSize: 13, color: FAINT, margin: "8px 0 0", lineHeight: 1.55 }}>
            Sitting out is the correct move more often than not. A day with nothing
            worth staking is a result, not a failure.
          </p>
        </div>
      )}

      {plays.length > 0 && (
        <>
          <div style={{ display: "grid", gap: 10, marginTop: session ? 0 : 20 }}>
            {plays.map((p, i) => (
              <AllocationRow key={p.pick_id} play={p} bankroll={profile.bankroll} index={i} />
            ))}
          </div>
          <div
            style={{
              ...card,
              marginTop: 10,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "baseline",
            }}
          >
            <span style={{ ...LABEL, color: DIM }}>Total exposure today</span>
            <span style={{ ...NUM, fontSize: 20, color: FG, marginLeft: "auto" }}>
              {totalDollars != null ? fmtMoney(totalDollars) : "-"}
            </span>
            <span style={{ ...NUM, fontSize: 14, color: DIM }}>{fmtPct(totalWeight, 1)}</span>
          </div>
        </>
      )}

      <div style={{ ...card, marginTop: 22 }}>
        <div style={{ ...LABEL, color: DIM, marginBottom: 14 }}>Accountability curve</div>
        <ReturnCurve ledger={ledger} />
      </div>

      <p
        style={{
          fontFamily: BODY,
          fontSize: 12.5,
          color: FAINT,
          lineHeight: 1.6,
          margin: "16px 0 0",
          maxWidth: 720,
        }}
      >
        Allocation math on public information. Not betting advice. No money moves
        through this site. Sizing is quarter Kelly on a deliberately conservative
        edge estimate, capped per play and per day, with one play per event so
        correlated picks cannot stack.
      </p>
    </section>
  );
};

export default Portfolio;
