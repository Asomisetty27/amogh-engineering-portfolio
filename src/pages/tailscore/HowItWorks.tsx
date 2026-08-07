// Plain-language explainer: everything a first-time visitor needs to read the page.
// Each block carries an id so chips and tooltips elsewhere can deep-link into it.
import { BODY, DIM, EMERALD, FG, LABEL, LINE, PANEL, SectionHead, WRAP } from "./ui";

const BLOCKS: { id: string; title: string; body: string }[] = [
  {
    id: "how-score",
    title: "What the score is",
    body:
      "Each capper gets a 0 to 1 confidence that they beat their own break-even. " +
      "0.5 means indistinguishable from the market. The math is anchored at break-even " +
      "with the weight of dozens of pseudo picks, so a hot week cannot fake a high " +
      "score. Recent picks count more; old form decays on a 90 day half life.",
  },
  {
    id: "how-winpct",
    title: "Why win percent lies",
    body:
      "A 55 percent record at -110 odds makes money. The same record at -200 loses it. " +
      "Every pick is graded against the break-even rate of its own odds, so favorite " +
      "heavy records get no free credit. At -110 the break-even is 52.4 percent.",
  },
  {
    id: "how-clv",
    title: "Closing line value",
    body:
      "If the line moves toward a capper's number after they post, they beat the " +
      "market, whether or not the pick cashed. CLV converges much faster than " +
      "win-loss records and is the best validated predictor of future profit. It " +
      "accrues from live capture, so it fills in as the pipeline runs.",
  },
  {
    id: "how-consensus",
    title: "Consensus, discounted",
    body:
      "When several cappers land on one side, the first poster gets full credit and " +
      "each later capper is discounted, because copying is not independent evidence. " +
      "The pile-on boost is capped so a crowd never outweighs a proven capper.",
  },
  {
    id: "how-units",
    title: "Units policy",
    body:
      "Stated unit sizes are never compared across cappers; unit inflation is rampant. " +
      "All grading is flat stake. Within one capper, sizing only counts once their " +
      "history proves their big plays actually hit more often. That earns the honest " +
      "sizing badge.",
  },
  {
    id: "how-stale",
    title: "Stale plays",
    body:
      "If the current price is meaningfully worse than the posted price, the edge has " +
      "already been captured by the market. The play is tagged STALE and given no " +
      "stake. Chasing a moved line is how good picks lose money.",
  },
  {
    id: "how-settlement",
    title: "How results are settled",
    body:
      "Results come from independent sources, never capper claims: box scores and " +
      "official scoreboards for game lines and props, tour scoreboards for tennis, " +
      "esports match results, and a budget capped web search with a cited source for " +
      "the rest. Every graded pick records which source settled it.",
  },
  {
    id: "how-honesty",
    title: "Grading honesty",
    body:
      "When settlement is ambiguous the pipeline refuses to guess; a pick stays " +
      "ungraded rather than wrongly graded. Low confidence extractions go to a human " +
      "review queue. Cappers with small samples carry an early read chip and their " +
      "scores stay muted near 0.5 until the sample is real.",
  },
];

const HowItWorks: React.FC = () => (
  <section id="how" className="ts-anchor" style={{ ...WRAP, paddingBottom: 64 }}>
    <SectionHead index="04" sub="Read this once" title="How it works" />
    <div
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      }}
    >
      {BLOCKS.map((b, i) => (
        <div
          key={b.id}
          id={b.id}
          className="ts-anchor ts-card"
          style={{
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 6,
            padding: 16,
            animationDelay: `${Math.min(i, 8) * 40}ms`,
          }}
        >
          <div style={{ ...LABEL, color: EMERALD, marginBottom: 8 }}>{b.title}</div>
          <p style={{ fontFamily: BODY, fontSize: 13.5, lineHeight: 1.6, color: DIM, margin: 0 }}>
            {b.body}
          </p>
        </div>
      ))}
    </div>
    <p style={{ fontFamily: BODY, fontSize: 12.5, color: FG, opacity: 0.6, marginTop: 18 }}>
      The short version: independent results, odds-aware math, small samples stay humble,
      and copying earns a discount, not a boost.
    </p>
  </section>
);

export default HowItWorks;
