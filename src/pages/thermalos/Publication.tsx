import { useEffect } from "react";

export default function Publication() {
  useEffect(() => {
    document.title = "ThermalOS -- Publication | amogh.site";
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1">
          ThermalOS -- Publication
        </div>
        <h1 className="text-[22px] md:text-[26px] font-semibold text-[#E6F7F1] tracking-tight">
          Conference publication
        </h1>
        <p className="text-[12px] text-[#888780] mt-1 max-w-2xl">
          Target venue, paper outline, and section status. Populates once conference target is confirmed with Kundu.
        </p>
      </div>

      <div className="space-y-3">
        <div
          className="bg-[#141412] border border-white/[0.07] rounded-md p-5"
          style={{ borderWidth: "0.5px" }}
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
            Target venue
          </div>
          <p className="text-[13px] text-[#888780]">
            TBD -- confirm with Kundu. Likely IISWC, ISCA, or IEEE TCAD depending on scope.
          </p>
        </div>

        <div
          className="bg-[#141412] border border-white/[0.07] rounded-md p-5"
          style={{ borderWidth: "0.5px" }}
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
            Section tracker
          </div>
          <p className="text-[12px] text-[#5a5a55] font-mono">
            Coming in Phase 4. Sections map to experiments: Methods uses E001-E004, Results uses E005-E008, Sensitivity uses ambient analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
