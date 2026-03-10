import type { ConfidenceBadge } from "@/data/portfolioData";
import { Shield, AlertTriangle } from "lucide-react";

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
    <span className={`inline-block w-2 h-2 rounded-full ${cls} animate-status-pulse`} style={{ color: `var(--${color?.replace('neon-', 'neon-')})` }} />
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

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl tracking-wider text-primary neon-text-cyan mb-6">
      {children}
    </h2>
  );
}

export function TodoField({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider rounded border border-neon-amber/30 bg-neon-amber/5 text-neon-amber">
      TODO{label ? `: ${label}` : ""}
    </span>
  );
}
