// Capper leaderboard: the receipts. Sortable, searchable, honest about sample size.
import { useMemo, useState } from "react";
import { Capper, fmtScore, fmtSigned } from "./api";
import {
  BODY, Bar, Chip, DIM, EMERALD, FAINT, FG, LABEL, LINE, MONO, NUM, PANEL,
  RED, SectionHead, WRAP, scoreColor,
} from "./ui";

type SortKey = "score" | "record" | "pl" | "price";

function valueRead(c: Capper): { text: string; color: string } {
  const price = c.monthly_price_usd;
  if (price == null) return { text: "free", color: DIM };
  if (c.n_graded < 15) return { text: "too early", color: FAINT };
  if (c.score >= 0.55 && price <= 40) return { text: "underpriced", color: EMERALD };
  if (c.score <= 0.45 && price >= 50) return { text: "overpriced", color: RED };
  if (c.score >= 0.55 && c.flat_pl > 0) return { text: `$${(price / c.flat_pl).toFixed(0)} per unit won`, color: DIM };
  if (c.score < 0.5 && c.flat_pl < 0) return { text: "paying to lose", color: RED };
  return { text: "fairly priced", color: FAINT };
}

const RankCell: React.FC<{ rank: number }> = ({ rank }) => (
  <span
    style={{
      ...NUM,
      fontSize: rank <= 3 ? 15 : 13,
      color: rank <= 3 ? EMERALD : FAINT,
      fontWeight: rank <= 3 ? 600 : 400,
    }}
  >
    {String(rank).padStart(2, "0")}
  </span>
);

const NameCell: React.FC<{ c: Capper }> = ({ c }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    <span style={{ fontFamily: BODY, color: FG }}>{c.capper}</span>
    {c.n_graded < 30 && <Chip color={FAINT}>early read</Chip>}
    {(c.units_calibration ?? 0) >= 0.6 && (
      <Chip color={EMERALD} title="their stated unit sizes predict their own results">
        honest sizing
      </Chip>
    )}
  </div>
);

const SortButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active, onClick, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="ts-chipbtn"
    style={{
      ...LABEL,
      color: active ? FG : FAINT,
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
    }}
  >
    {children}
    {active ? " ↓" : ""}
  </button>
);

const FadeWatch: React.FC<{ cappers: Capper[] }> = ({ cappers }) => {
  const pool = cappers.filter((c) => c.n_graded >= 30);
  const fallback = pool.length >= 3 ? pool : cappers.filter((c) => c.n_graded >= 15);
  const worst = [...fallback].sort((a, b) => a.score - b.score).slice(0, 3);
  if (worst.length === 0) return null;
  return (
    <div
      style={{
        border: `1px solid ${LINE}`,
        borderLeft: `2px solid ${RED}`,
        borderRadius: 6,
        background: PANEL,
        padding: "14px 16px",
        marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ ...LABEL, color: RED }}>Fade watch</span>
        <span style={{ fontFamily: BODY, fontSize: 12.5, color: FAINT }}>
          Lowest scores with a real sample. The receipts.
        </span>
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {worst.map((c) => (
          <div key={c.capper} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ ...NUM, fontSize: 14, color: RED }}>{fmtScore(c.score)}</span>
            <span style={{ fontFamily: BODY, fontSize: 13, color: FG }}>{c.capper}</span>
            <span style={{ ...NUM, fontSize: 11.5, color: DIM }}>
              {c.wins}-{c.losses}
            </span>
            {c.monthly_price_usd != null && (
              <span style={{ ...NUM, fontSize: 11.5, color: FAINT }}>
                ${c.monthly_price_usd.toFixed(0)}/mo
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Leaderboard: React.FC<{ cappers: Capper[] }> = ({ cappers }) => {
  const [sort, setSort] = useState<SortKey>("score");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? cappers.filter((c) => c.capper.toLowerCase().includes(q)) : cappers;
    const s = [...filtered];
    if (sort === "score") s.sort((a, b) => b.score - a.score);
    if (sort === "record") s.sort((a, b) => b.wins - b.losses - (a.wins - a.losses));
    if (sort === "pl") s.sort((a, b) => b.flat_pl - a.flat_pl);
    if (sort === "price") s.sort((a, b) => (a.monthly_price_usd ?? 0) - (b.monthly_price_usd ?? 0));
    return s;
  }, [cappers, sort, query]);

  const ranks = useMemo(() => {
    const byScore = [...cappers].sort((a, b) => b.score - a.score);
    return new Map(byScore.map((c, i) => [c.capper, i + 1]));
  }, [cappers]);

  const ariaSort = (k: SortKey) => (sort === k ? ("descending" as const) : undefined);

  return (
    <section style={{ ...WRAP, paddingBottom: 56 }}>
      <SectionHead
        index="02"
        sub="Peer-relative ranking"
        title="Capper Leaderboard"
        right={
          <input
            className="ts-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="/ filter cappers"
            aria-label="Filter cappers by name"
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: FG,
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderRadius: 6,
              padding: "8px 12px",
              width: 190,
            }}
          />
        }
      />

      <FadeWatch cappers={cappers} />

      {/* wide: table */}
      <div className="ts-desktop" style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 6, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...LABEL, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>#</th>
              <th style={{ ...LABEL, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>Capper</th>
              <th aria-sort={ariaSort("score")} style={{ textAlign: "right", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>
                <SortButton active={sort === "score"} onClick={() => setSort("score")}>Score</SortButton>
              </th>
              <th aria-sort={ariaSort("record")} style={{ textAlign: "right", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>
                <SortButton active={sort === "record"} onClick={() => setSort("record")}>W-L-P</SortButton>
              </th>
              <th aria-sort={ariaSort("pl")} style={{ textAlign: "right", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>
                <SortButton active={sort === "pl"} onClick={() => setSort("pl")}>Flat P/L</SortButton>
              </th>
              <th aria-sort={ariaSort("price")} style={{ textAlign: "right", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>
                <SortButton active={sort === "price"} onClick={() => setSort("price")}>Price</SortButton>
              </th>
              <th style={{ ...LABEL, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const early = c.n_graded < 30;
              const sc = scoreColor(c.score);
              const v = valueRead(c);
              return (
                <tr key={c.capper} className="ts-row">
                  <td style={{ padding: 12, borderBottom: `1px solid ${LINE}` }}>
                    <RankCell rank={ranks.get(c.capper) ?? 0} />
                  </td>
                  <td style={{ padding: 12, borderBottom: `1px solid ${LINE}` }}>
                    <NameCell c={c} />
                  </td>
                  <td style={{ padding: 12, borderBottom: `1px solid ${LINE}`, textAlign: "right" }}>
                    <div style={{ display: "inline-block", minWidth: 62, textAlign: "right" }}>
                      <div style={{ ...NUM, fontSize: 14, color: sc, opacity: early ? 0.6 : 1 }}>
                        {fmtScore(c.score)}
                      </div>
                      <div style={{ marginTop: 5, opacity: early ? 0.5 : 1 }}>
                        <Bar value={c.score} color={sc} height={3} animate={false} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...NUM, padding: 12, borderBottom: `1px solid ${LINE}`, textAlign: "right", fontSize: 13, color: DIM }}>
                    {c.wins}-{c.losses}-{c.pushes}
                  </td>
                  <td style={{ ...NUM, padding: 12, borderBottom: `1px solid ${LINE}`, textAlign: "right", fontSize: 13, color: c.flat_pl > 0 ? EMERALD : c.flat_pl < 0 ? RED : DIM }}>
                    {fmtSigned(c.flat_pl)}
                  </td>
                  <td style={{ ...NUM, padding: 12, borderBottom: `1px solid ${LINE}`, textAlign: "right", fontSize: 13, color: DIM }}>
                    {c.monthly_price_usd != null ? `$${c.monthly_price_usd.toFixed(0)}` : "-"}
                  </td>
                  <td style={{ ...LABEL, padding: 12, borderBottom: `1px solid ${LINE}`, fontSize: 9.5, color: v.color }}>
                    {v.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* narrow: stacked cards, same data */}
      <div className="ts-mobile">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((c) => {
            const early = c.n_graded < 30;
            const sc = scoreColor(c.score);
            const v = valueRead(c);
            return (
              <div
                key={c.capper}
                style={{
                  background: PANEL,
                  border: `1px solid ${LINE}`,
                  borderRadius: 6,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <RankCell rank={ranks.get(c.capper) ?? 0} />
                  <NameCell c={c} />
                  <span style={{ ...NUM, fontSize: 16, color: sc, marginLeft: "auto", opacity: early ? 0.6 : 1 }}>
                    {fmtScore(c.score)}
                  </span>
                </div>
                <Bar value={c.score} color={sc} height={3} animate={false} />
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline" }}>
                  <span style={{ ...NUM, fontSize: 12, color: DIM }}>{c.wins}-{c.losses}-{c.pushes}</span>
                  <span style={{ ...NUM, fontSize: 12, color: c.flat_pl > 0 ? EMERALD : c.flat_pl < 0 ? RED : DIM }}>
                    {fmtSigned(c.flat_pl)}
                  </span>
                  <span style={{ ...NUM, fontSize: 12, color: DIM }}>
                    {c.monthly_price_usd != null ? `$${c.monthly_price_usd.toFixed(0)}/mo` : "free"}
                  </span>
                  <span style={{ ...LABEL, fontSize: 9, color: v.color, marginLeft: "auto" }}>{v.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {rows.length === 0 && (
        <p style={{ fontFamily: BODY, fontSize: 14, color: FAINT, marginTop: 14 }}>
          {query ? "No capper matches that filter." : "No graded cappers yet."}
        </p>
      )}
    </section>
  );
};

export default Leaderboard;
