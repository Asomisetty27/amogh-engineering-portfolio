// Today's board: ranked play cards, live filters, capper chips with scores.
import { useMemo, useState } from "react";
import { Play, fmtScore, relTime } from "./api";
import {
  BG, BODY, Bar, Chip, DIM, EMERALD, FAINT, FG, GRAY, LABEL, LINE, LINE_2,
  MONO, NUM, PANEL, RED, SectionHead, TAG_COLOR, WRAP, scoreColor,
} from "./ui";

const CapperChips: React.FC<{ play: Play }> = ({ play }) => {
  const [expanded, setExpanded] = useState(false);
  const list =
    play.cappers && play.cappers.length > 0
      ? play.cappers
      : [{ name: play.capper, score: Number.NaN }];
  const shown = expanded ? list : list.slice(0, 3);
  const hidden = list.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {shown.map((c, i) => (
        <span
          key={c.name}
          title={i === 0 ? "posted it first" : undefined}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: 999,
            border: `1px solid ${i === 0 ? "rgba(255,255,255,0.22)" : LINE}`,
            fontFamily: BODY,
            fontSize: 12,
            color: DIM,
          }}
        >
          {i === 0 && (
            <span
              aria-hidden
              style={{ width: 4, height: 4, borderRadius: 999, background: FG, opacity: 0.7 }}
            />
          )}
          {c.name}
          {Number.isFinite(c.score) && (
            <span style={{ ...NUM, fontSize: 11, color: scoreColor(c.score) }}>
              {fmtScore(c.score)}
            </span>
          )}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ts-chipbtn"
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            border: `1px solid ${LINE}`,
            background: "transparent",
            fontFamily: BODY,
            fontSize: 12,
            color: FAINT,
            cursor: "pointer",
          }}
        >
          +{hidden} more
        </button>
      )}
    </div>
  );
};

const PlayCard: React.FC<{ play: Play; index: number }> = ({ play, index }) => {
  const color = TAG_COLOR[play.tag] ?? GRAY;
  return (
    <article
      className="ts-card ts-hover"
      style={{
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderLeft: `2px solid ${color}`,
        borderRadius: 6,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...NUM, fontSize: 28, fontWeight: 600, color, letterSpacing: "-0.03em" }}>
          {fmtScore(play.play_score)}
        </span>
        <Chip color={color} active>{play.tag}</Chip>
        {play.corroborated && (
          <span
            title="independently flagged by an EV model"
            style={{ ...LABEL, color: TAG_COLOR.LEAN, fontSize: 12, letterSpacing: 0 }}
          >
            ⚡
          </span>
        )}
        <span style={{ ...LABEL, marginLeft: "auto" }}>{relTime(play.posted_at)}</span>
      </div>

      <Bar value={play.play_score} color={color} />

      <p style={{ fontFamily: BODY, fontSize: 15, lineHeight: 1.45, color: FG, margin: 0 }}>
        {play.description}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <CapperChips play={play} />
        {play.stake_units != null && (
          <span
            title="suggested stake, quarter-Kelly"
            style={{ ...NUM, fontSize: 11, color: FAINT, marginLeft: "auto" }}
          >
            {play.stake_units.toFixed(1)}u
          </span>
        )}
      </div>
    </article>
  );
};

type Filter = "all" | "actionable" | "fade";
type Order = "score" | "newest";
type Market = "all" | "book" | "props";

// null market_type (stale rows) counts as a book play by directive
const marketOf = (p: Play): "book" | "props" | "other" => {
  const m = p.market_type;
  if (m === "player_prop" || m === "team_prop") return "props";
  if (m === "spread" || m === "moneyline" || m === "total" || m == null) return "book";
  return "other";
};

const SegTab: React.FC<{
  active: boolean;
  onClick: () => void;
  count?: number;
  first?: boolean;
  children: React.ReactNode;
}> = ({ active, onClick, count, first, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="ts-chipbtn"
    style={{
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: active ? 700 : 400,
      color: active ? BG : DIM,
      background: active ? FG : "transparent",
      border: "none",
      borderLeft: first ? "none" : `1px solid ${LINE}`,
      padding: "10px 18px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "baseline",
      gap: 7,
    }}
  >
    {children}
    {count != null && (
      <span style={{ ...NUM, fontSize: 10, opacity: 0.65 }}>{count}</span>
    )}
  </button>
);

const Board: React.FC<{ plays: Play[] }> = ({ plays }) => {
  const [market, setMarket] = useState<Market>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [order, setOrder] = useState<Order>("score");

  const counts = useMemo(() => ({
    all: plays.length,
    book: plays.filter((p) => marketOf(p) === "book").length,
    props: plays.filter((p) => marketOf(p) === "props").length,
  }), [plays]);

  const shown = useMemo(() => {
    const m = market === "all" ? plays : plays.filter((p) => marketOf(p) === market);
    const f =
      filter === "actionable"
        ? m.filter((p) => p.tag === "TAIL" || p.tag === "LEAN")
        : filter === "fade"
          ? m.filter((p) => p.tag === "FADE")
          : m;
    const s = [...f];
    if (order === "score") s.sort((a, b) => b.play_score - a.play_score);
    else s.sort((a, b) => +new Date(b.posted_at) - +new Date(a.posted_at));
    return s;
  }, [plays, market, filter, order]);

  const hasActionable = plays.some((p) => p.tag === "TAIL" || p.tag === "LEAN");

  return (
    <section style={{ ...WRAP, paddingTop: 44, paddingBottom: 56 }}>
      <SectionHead index="01" sub="Live board" title="Today's Board" />

      {/* market tabs: the top-level split, heavier than the filter chips below */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div
          role="tablist"
          aria-label="Market type"
          style={{
            display: "inline-flex",
            border: `1px solid ${LINE_2}`,
            borderRadius: 8,
            overflow: "hidden",
            background: PANEL,
          }}
        >
          <SegTab first active={market === "all"} onClick={() => setMarket("all")} count={counts.all}>
            All
          </SegTab>
          <SegTab active={market === "book"} onClick={() => setMarket("book")} count={counts.book}>
            Book plays
          </SegTab>
          <SegTab active={market === "props"} onClick={() => setMarket("props")} count={counts.props}>
            Props
          </SegTab>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip active={filter === "actionable"} color={EMERALD} onClick={() => setFilter("actionable")}>
            Tail + Lean
          </Chip>
          <Chip active={filter === "fade"} color={RED} onClick={() => setFilter("fade")}>Fade</Chip>
          <span aria-hidden style={{ width: 1, height: 18, background: LINE }} />
          <Chip active={order === "score"} onClick={() => setOrder("score")}>By score</Chip>
          <Chip active={order === "newest"} onClick={() => setOrder("newest")}>Newest</Chip>
        </div>
      </div>

      {!hasActionable && (
        <p style={{ fontFamily: BODY, fontSize: 14, color: DIM, marginBottom: 20 }}>
          No high-confidence plays yet today. The board fills as cappers post.
        </p>
      )}

      {shown.length === 0 ? (
        <p style={{ fontFamily: BODY, fontSize: 14, color: FAINT }}>
          Nothing matches this filter right now.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
          {shown.map((p, i) => <PlayCard key={p.play_key} play={p} index={i} />)}
        </div>
      )}
    </section>
  );
};

export default Board;
