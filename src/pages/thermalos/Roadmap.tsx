import { useEffect } from "react";
import { Check } from "lucide-react";

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  status: "complete" | "in_progress" | "locked";
  progress: number;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: "Colab baseline",
    subtitle: "Tesla T4 · 5,700 rows · E001-E004 complete",
    status: "complete",
    progress: 100,
  },
  {
    id: 2,
    title: "Dedicated GPU hardware",
    subtitle: "Physical machine · power-cap sweep · E005-E008 · ambient sensor",
    status: "in_progress",
    progress: 10,
  },
  {
    id: 3,
    title: "Anomaly detector v1",
    subtitle: "Bayesian classifier on clean baseline · 10+ trial replications",
    status: "locked",
    progress: 0,
  },
  {
    id: 4,
    title: "Multi-GPU validation + publication",
    subtitle: "A100 / H100 / RTX generalization · conference paper",
    status: "locked",
    progress: 0,
  },
];

const STATUS_COLOR = {
  complete:    { fg: "#35C792", dot: "#35C792" },
  in_progress: { fg: "#60a5fa", dot: "#60a5fa" },
  locked:      { fg: "#888780", dot: "#2C2C2A" },
};

const STATUS_LABEL = {
  complete:    "Complete",
  in_progress: "In progress",
  locked:      "Locked",
};

export default function Roadmap() {
  useEffect(() => {
    document.title = "ThermalOS -- Roadmap | amogh.site";
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1">
          ThermalOS -- Roadmap
        </div>
        <h1 className="text-[22px] md:text-[26px] font-semibold text-[#E6F7F1] tracking-tight">
          Research roadmap
        </h1>
        <p className="text-[12px] text-[#888780] mt-1 max-w-2xl">
          Four-stage path from Colab baseline to conference publication. Stage 2 is gated on AI Factory cluster access.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-3 bottom-3 w-px bg-white/[0.08]" aria-hidden />
        <div className="space-y-4">
          {STAGES.map((s) => {
            const c = STATUS_COLOR[s.status];
            const dim = s.status === "locked" ? "opacity-50" : "";
            return (
              <div key={s.id} className={`relative pl-10 ${dim}`}>
                <div
                  className="absolute left-0 top-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: s.status !== "locked" ? c.fg : "#0A0A08",
                    border: `0.5px solid ${s.status !== "locked" ? c.fg : "#ffffff15"}`,
                  }}
                >
                  {s.status === "complete" ? (
                    <Check size={12} className="text-[#0A0A08]" />
                  ) : (
                    <span className="text-[10px] font-mono font-semibold" style={{ color: c.fg }}>
                      {s.id}
                    </span>
                  )}
                </div>

                <div
                  className="bg-[#141412] border border-white/[0.07] rounded-md px-4 py-3"
                  style={{ borderWidth: "0.5px" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-mono text-[#5a5a55] uppercase tracking-wider">
                          Stage {s.id}
                        </span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ color: c.fg, background: `${c.fg}15`, border: `0.5px solid ${c.fg}40` }}
                        >
                          {STATUS_LABEL[s.status]}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-[#E6F7F1] leading-tight">
                        {s.title}
                      </div>
                      <div className="text-[11px] font-mono text-[#888780] mt-0.5 leading-snug">
                        {s.subtitle}
                      </div>
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-[#888780] flex-shrink-0">
                      {s.progress}%
                    </div>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.progress}%`, background: c.fg }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 px-4 py-3 rounded bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[11px] font-mono text-[#EF9F27]">
        Stage 2 is gated on AI Factory cluster access (Cal Poly Noyce School, DGX B200). Publication timeline will be overlaid here once conference target and deadline are confirmed with Kundu.
      </div>
    </div>
  );
}
