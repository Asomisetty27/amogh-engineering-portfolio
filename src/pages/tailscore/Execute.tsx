// Kalshi execution surface. Two things happen here and nothing else: the board's
// tradeable plays are priced against the exchange, and a signed-in user can queue a
// paper order on one.
//
// Why the numbers look the way they do. On Kalshi a contract price IS a probability,
// so there is no vig to strip and no book to shop. Our model does not propose a
// probability of its own; it proposes a delta on top of the market's. The exchange
// then charges a fee it rounds UP to the whole cent, which at midfield prices is 2c
// against an edge map that tops out at 5c. So the only honest column is net edge,
// and it is frequently negative. When it is, the button is off. That is the feature.
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  EXECUTION_ENABLED, ExecState, Fill, Quote, fetchExecution, fmtCents, fmtPct,
  queueIntent, relTime, summarizeFills,
} from "./api";
import { Session, getSession } from "./auth";
import {
  AMBER, BG, BODY, DIM, EASE, EMERALD, FAINT, FG, GRAY, LABEL, LINE, LINE_2,
  NUM, PANEL, PANEL_2, RED, SectionHead, WRAP,
} from "./ui";

const card: React.CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 6,
};

const edgeColor = (net: number | null) =>
  net === null ? GRAY : net > 0 ? EMERALD : net < 0 ? RED : FG;

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({
  label, value, tone,
}) => (
  <div style={{ padding: "12px 16px", borderRight: `1px solid ${LINE}`, flex: "1 1 120px" }}>
    <div style={{ ...LABEL, color: DIM, marginBottom: 5 }}>{label}</div>
    <div style={{ ...NUM, fontSize: 16, color: tone ?? FG }}>{value}</div>
  </div>
);

const QuoteRow: React.FC<{
  quote: Quote;
  session: Session | null;
  index: number;
  onQueued: (pickId: string, msg: string, ok: boolean) => void;
  result?: { ok: boolean; msg: string };
}> = ({ quote: q, session, index, onQueued, result }) => {
  const [busy, setBusy] = useState(false);

  const click = useCallback(async () => {
    if (!session) return onQueued(q.pick_id, "Sign in on the Portfolio section first.", false);
    setBusy(true);
    const res = await queueIntent(session.accessToken, q.pick_id, q.contracts_rec);
    setBusy(false);
    onQueued(q.pick_id, res.ok ? `Queued ${q.contracts_rec} contracts` : res.reason ?? "Refused", res.ok);
  }, [session, q.pick_id, q.contracts_rec, onQueued]);

  const live = q.tradeable && !!session;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px,1fr) 62px 68px 58px 74px 58px 128px",
        gap: 10,
        alignItems: "center",
        padding: "13px 16px",
        borderTop: `1px solid ${LINE}`,
        opacity: q.tradeable ? 1 : 0.72,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: BODY, fontSize: 14, color: FG, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {q.description}
        </div>
        <div style={{ ...LABEL, color: FAINT, marginTop: 4, fontSize: 9 }}>
          {q.ticker}
        </div>
      </div>

      <div style={{ ...NUM, fontSize: 13, color: FG }} title="The price you would pay. On Kalshi this is already a probability.">
        {fmtCents(q.yes_ask)}
      </div>
      <div style={{ ...NUM, fontSize: 13, color: DIM }} title="Our model's claimed edge over the market price.">
        {q.score_edge >= 0 ? "+" : ""}{(q.score_edge * 100).toFixed(1)}c
      </div>
      <div style={{ ...NUM, fontSize: 13, color: AMBER }} title="Kalshi's fee, rounded up to the whole cent.">
        -{(q.fee_per_contract * 100).toFixed(0)}c
      </div>
      <div style={{ ...NUM, fontSize: 14, color: edgeColor(q.net_edge), fontWeight: 600 }} title="Claimed edge minus the fee. The only number that decides a trade.">
        {q.net_edge === null ? "-" : `${q.net_edge >= 0 ? "+" : ""}${(q.net_edge * 100).toFixed(1)}c`}
      </div>
      <div style={{ ...NUM, fontSize: 13, color: q.contracts_rec > 0 ? FG : FAINT }}>
        {q.contracts_rec || "-"}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {result ? (
          <span style={{ ...LABEL, fontSize: 9, color: result.ok ? EMERALD : GRAY, textAlign: "right" }}>
            {result.msg}
          </span>
        ) : (
          <button
            onClick={click}
            disabled={!live || busy}
            title={q.tradeable ? (session ? "Queue a paper order" : "Sign in first") : q.blocked_reason ?? ""}
            style={{
              ...LABEL,
              fontSize: 9,
              letterSpacing: "0.14em",
              padding: "8px 12px",
              borderRadius: 4,
              cursor: live && !busy ? "pointer" : "not-allowed",
              color: live ? BG : FAINT,
              background: live ? EMERALD : "transparent",
              border: live ? "none" : `1px solid ${LINE_2}`,
              transition: `all 0.2s ${EASE}`,
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "QUEUING" : q.tradeable ? "PAPER BUY" : "NO EDGE"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const Execute: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [state, setState] = useState<ExecState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const load = useCallback(async () => {
    if (!EXECUTION_ENABLED) {
      setLoaded(true);
      return;
    }
    try {
      const data = await fetchExecution();
      setQuotes(data.quotes);
      setFills(data.fills);
      setState(data.state);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unavailable");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    if (!EXECUTION_ENABLED) return;
    const t = setInterval(load, 60_000);
    const onFocus = () => setSession(getSession());
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const onQueued = useCallback((pickId: string, msg: string, ok: boolean) => {
    setResults((r) => ({ ...r, [pickId]: { ok, msg } }));
  }, []);

  const tradeable = useMemo(() => quotes.filter((q) => q.tradeable).length, [quotes]);
  const ledger = useMemo(() => summarizeFills(fills), [fills]);

  if (!EXECUTION_ENABLED || !loaded) return null;

  return (
    <section id="execute" style={{ ...WRAP, paddingTop: 76 }}>
      <SectionHead
        index="03"
        sub={
          state
            ? `${quotes.length} quoted / ${tradeable} tradeable / synced ${relTime(state.generated_at)}`
            : "Kalshi execution"
        }
        title="Execute"
      />

      <p style={{ fontFamily: BODY, fontSize: 15, lineHeight: 1.6, color: DIM, maxWidth: 680, marginTop: -6, marginBottom: 22 }}>
        Kalshi prices are probabilities, so a contract at 54c is the market saying 54%.
        The model only proposes a delta on top of that, and the exchange charges a fee
        it rounds up to the whole cent. Net edge is what survives. Orders are paper
        until the ledger below earns the right to be real.
      </p>

      {state && (
        <div style={{ ...card, display: "flex", flexWrap: "wrap", marginBottom: 18 }}>
          <Stat label="Mode" value={state.live_enabled ? "LIVE" : "PAPER"} tone={state.live_enabled ? AMBER : EMERALD} />
          <Stat label="Edge floor" value={`${(state.min_net_edge * 100).toFixed(0)}c`} />
          <Stat label="Bankroll" value={`$${state.bankroll_usd.toFixed(0)}`} />
          <Stat label="Max per order" value={`$${state.max_cost_per_order.toFixed(2)}`} />
          <Stat label="Spent today" value={`$${state.spent_today.toFixed(2)} / $${state.daily_cost_cap.toFixed(2)}`} />
          <Stat
            label="Kill switch"
            value={state.kill_switch ? "ENGAGED" : "OFF"}
            tone={state.kill_switch ? RED : DIM}
          />
        </div>
      )}

      {error && (
        <div style={{ ...card, borderLeft: `2px solid ${RED}`, padding: 18, marginBottom: 18 }}>
          <div style={{ ...LABEL, color: RED, marginBottom: 6 }}>Quote feed unavailable</div>
          <p style={{ fontFamily: BODY, fontSize: 14, color: DIM, margin: 0 }}>
            Could not reach the execution feed ({error}). Retrying automatically.
          </p>
        </div>
      )}

      <div style={{ ...card, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px,1fr) 62px 68px 58px 74px 58px 128px",
            gap: 10,
            padding: "11px 16px",
            background: PANEL_2,
            ...LABEL,
            color: DIM,
            fontSize: 9,
          }}
        >
          <span>Play</span>
          <span>Ask</span>
          <span>Our edge</span>
          <span>Fee</span>
          <span>Net</span>
          <span>Qty</span>
          <span style={{ textAlign: "right" }}>Action</span>
        </div>

        {quotes.length === 0 ? (
          <div style={{ padding: "34px 18px", textAlign: "center" }}>
            <div style={{ ...LABEL, color: DIM, marginBottom: 8 }}>Nothing quoted</div>
            <p style={{ fontFamily: BODY, fontSize: 14, color: FAINT, margin: "0 auto", maxWidth: 460, lineHeight: 1.55 }}>
              Kalshi lists game lines for a handful of leagues, and roughly four in five
              tracked picks are player props it does not carry. When today's board has
              nothing the exchange trades, this stays empty.
            </p>
          </div>
        ) : (
          quotes.map((q, i) => (
            <QuoteRow
              key={q.pick_id}
              quote={q}
              session={session}
              index={i}
              onQueued={onQueued}
              result={results[q.pick_id]}
            />
          ))
        )}

        {quotes.length > 0 && tradeable === 0 && (
          <div style={{ borderTop: `1px solid ${LINE}`, background: PANEL_2, padding: "14px 16px" }}>
            <p style={{ fontFamily: BODY, fontSize: 13, color: DIM, margin: 0, lineHeight: 1.55 }}>
              Every quote above is priced, and none of them clear the fee. The model's
              edge on these plays is smaller than what Kalshi charges to take the other
              side, so the correct action is to sit. Buttons turn on by themselves when
              a play clears the floor.
            </p>
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: 18, padding: 18 }}>
        <div style={{ ...LABEL, color: DIM, marginBottom: 12 }}>Paper ledger</div>
        {!ledger ? (
          <p style={{ fontFamily: BODY, fontSize: 14, color: FAINT, margin: 0, lineHeight: 1.55 }}>
            No orders yet. Every fill here prices at the full ask and pays the full fee,
            because a paper ledger that fills at the midpoint would show profit the real
            account could never reproduce.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 26 }}>
            <div>
              <div style={{ ...LABEL, color: FAINT, fontSize: 9 }}>Fills</div>
              <div style={{ ...NUM, fontSize: 17, color: FG }}>{ledger.fills}</div>
            </div>
            <div>
              <div style={{ ...LABEL, color: FAINT, fontSize: 9 }}>Settled</div>
              <div style={{ ...NUM, fontSize: 17, color: FG }}>
                {ledger.wins}-{ledger.losses}
              </div>
            </div>
            <div>
              <div style={{ ...LABEL, color: FAINT, fontSize: 9 }}>Staked</div>
              <div style={{ ...NUM, fontSize: 17, color: FG }}>${ledger.staked.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ ...LABEL, color: FAINT, fontSize: 9 }}>Fees paid</div>
              <div style={{ ...NUM, fontSize: 17, color: AMBER }}>${ledger.fees.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ ...LABEL, color: FAINT, fontSize: 9 }}>Net P&amp;L</div>
              <div style={{ ...NUM, fontSize: 17, color: ledger.pnl >= 0 ? EMERALD : RED }}>
                {ledger.pnl >= 0 ? "+" : "-"}${Math.abs(ledger.pnl).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ ...LABEL, color: FAINT, fontSize: 9 }}>ROI</div>
              <div style={{ ...NUM, fontSize: 17, color: ledger.roi === null ? GRAY : ledger.roi >= 0 ? EMERALD : RED }}>
                {ledger.roi === null ? "pending" : fmtPct(ledger.roi, 1)}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Execute;
