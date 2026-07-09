import { motion } from "framer-motion";
import type { ConfidenceBadge } from "@/data/portfolioData";
import { Shield, AlertTriangle, Clock } from "lucide-react";

export function ConfidenceBadgeTag({ confidence }: { confidence: ConfidenceBadge }) {
  if (confidence === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider rounded-full border border-neon-green/40 bg-neon-green/10 text-neon-green">
        <Shield size={10} />
        VERIFIED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider rounded-full border border-neon-amber/40 bg-neon-amber/10 text-neon-amber">
      <AlertTriangle size={10} />
      CONCEPTUAL
    </span>
  );
}

export function StatusLight({ color }: { color: string }) {
  const colorMap: Record<string, string> = {
    "neon-green": "bg-neon-green",
    "neon-cyan": "bg-neon-cyan",
    "neon-amber": "bg-neon-amber",
    "neon-red": "bg-neon-red",
    "neon-magenta": "bg-neon-magenta",
  };
  const cls = colorMap[color] || "bg-neon-cyan";
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${cls} animate-status-pulse`} />
  );
}

export function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-panel-border">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-neon-red/60" />
        <span className="w-2 h-2 rounded-full bg-neon-amber/60" />
        <span className="w-2 h-2 rounded-full bg-neon-green/60" />
      </div>
      <span className="text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase">
        {children}
      </span>
    </div>
  );
}

export function SectionTitle({ children, index }: { children: React.ReactNode; index?: string }) {
  return (
    <div className="mb-7">
      {index && (
        <div className="flex items-center gap-2 mb-1.5">
          <span aria-hidden style={{ width: 14, height: 1, background: "rgba(212,175,55,0.8)" }} />
          <span
            className="font-mono"
            style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(212,175,55,0.65)" }}
          >
            {index}
          </span>
        </div>
      )}
      <h2
        className="font-display text-2xl md:text-[26px] tracking-wide font-semibold"
        style={{
          background:
            "linear-gradient(168deg, hsl(42 45% 96%) 0%, hsl(44 55% 84%) 45%, hsl(46 65% 58%) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {children}
      </h2>
      {/* Drafted rule - draws in like a measurement line */}
      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: 1,
          marginTop: 10,
          transformOrigin: "left center",
          background:
            "linear-gradient(90deg, rgba(212,175,55,0.55), rgba(212,175,55,0.12) 60%, transparent)",
        }}
      />
    </div>
  );
}

export function EvidencePending({ items }: { items: string[] }) {
  return (
    <div className="border border-neon-amber/20 rounded-lg p-4 bg-neon-amber/5">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} className="text-neon-amber" />
        <span className="text-xs font-mono font-semibold tracking-wider text-neon-amber uppercase">
          Evidence Pending
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-neon-amber/60">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
