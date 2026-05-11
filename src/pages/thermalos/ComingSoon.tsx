import { useEffect } from "react";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  useEffect(() => {
    document.title = `ThermalOS — ${title} | amogh.site`;
  }, [title]);
  return (
    <div className="bg-[#141412] border border-white/[0.07] rounded-xl p-10 flex flex-col items-center justify-center text-center">
      <Construction size={28} className="text-[#1D9E75] mb-3" />
      <h2 className="font-bold text-lg mb-1">{title}</h2>
      <p className="text-[12px] font-mono text-[#888780] max-w-md">
        Phase 1 ships Live Telemetry + Master Timeline. This view is queued for the next pass —
        Experiments, Outreach, YC Checklist, Today Plan, and Evidence Board come next.
      </p>
    </div>
  );
}
