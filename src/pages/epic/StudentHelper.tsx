import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRICULUM, DAY_TITLES, WIRE, COHORT, GROUP_COUNT, type Activity, type HelpType } from "./curriculum";

const LS_GROUP = "epic_group";
const pad2 = (n: number) => String(n).padStart(2, "0");

type Broadcast = { id: string; message: string; created_at: string };

export default function StudentHelper() {
  const [group, setGroup] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string>(CURRICULUM[0].id);
  const [copied, setCopied] = useState(false);
  const [troubleOpen, setTroubleOpen] = useState(false);
  const [notified, setNotified] = useState<HelpType | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Load saved group
  useEffect(() => {
    const raw = localStorage.getItem(LS_GROUP);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (n >= 1 && n <= GROUP_COUNT) setGroup(n);
  }, []);

  const activity = useMemo(
    () => CURRICULUM.find(a => a.id === activeId) ?? CURRICULUM[0],
    [activeId]
  );

  // Reset transient state when activity changes
  useEffect(() => {
    setCopied(false);
    setTroubleOpen(false);
    setNotified(null);
    setImgOk(true);
  }, [activeId]);

  // Upsert progress on activity open
  useEffect(() => {
    if (group == null) return;
    supabase.from("group_progress").upsert(
      { cohort: COHORT, group_no: group, activity: activity.title, updated_at: new Date().toISOString() },
      { onConflict: "cohort,group_no" }
    ).then(() => {});
  }, [group, activity.title]);

  const pickGroup = (n: number) => {
    localStorage.setItem(LS_GROUP, String(n));
    setGroup(n);
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(activity.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const sendHelp = async (type: HelpType) => {
    if (group == null) return;
    // Resolve any existing open request of same type+group to avoid duplicates
    await supabase.from("help_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("cohort", COHORT).eq("group_no", group).eq("type", type).eq("status", "open");
    await supabase.from("help_requests").insert({
      cohort: COHORT, group_no: group, type, activity: activity.title,
    });
    setNotified(type);
    setTimeout(() => setNotified(curr => curr === type ? null : curr), 2200);
  };

  if (group == null) {
    return (
      <div className="min-h-screen bg-[#09090D] text-foreground flex items-center justify-center p-6">
        <div className="fx-glass fx-card max-w-md w-full rounded-lg p-6 border border-panel-border">
          <h1 className="text-xl font-semibold mb-1">EPIC 2026 — Arduino Lab</h1>
          <p className="text-sm text-muted-foreground mb-5">Pick your group to begin.</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: GROUP_COUNT }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => pickGroup(n)}
                className="h-14 rounded-md border border-panel-border bg-white/[0.02] hover:bg-white/[0.06] text-base font-mono">
                G{pad2(n)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group activities by day
  const byDay: Record<number, Activity[]> = {};
  CURRICULUM.forEach(a => { (byDay[a.day] ||= []).push(a); });

  return (
    <div className="min-h-screen bg-[#09090D] text-foreground">
      <header className="sticky top-0 z-20 border-b border-panel-border bg-[#0b0b10]/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">EPIC 2026 · Arduino Lab</div>
          <h1 className="text-base font-semibold">{activity.title}</h1>
        </div>
        <button onClick={() => { localStorage.removeItem(LS_GROUP); setGroup(null); }}
          className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
          GROUP {pad2(group)} · change
        </button>
      </header>

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto pb-32">
        {/* Left nav */}
        <aside className="md:w-64 md:border-r border-panel-border p-3 md:p-4 md:sticky md:top-[60px] md:self-start md:h-[calc(100vh-60px)] md:overflow-y-auto">
          {Object.keys(DAY_TITLES).map(k => {
            const day = Number(k);
            return (
              <div key={day} className="mb-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{DAY_TITLES[day]}</div>
                <ul className="space-y-1">
                  {(byDay[day] ?? []).map(a => (
                    <li key={a.id}>
                      <button onClick={() => setActiveId(a.id)}
                        className={`w-full text-left text-sm px-2.5 py-1.5 rounded border transition-colors ${
                          a.id === activeId
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-transparent hover:bg-white/[0.04] text-secondary-foreground"
                        }`}>
                        <span className="font-mono text-[10px] text-muted-foreground mr-1.5">{a.lesson}</span>
                        {a.title}
                        {a.optional && <span className="ml-1 text-[10px] text-muted-foreground">(opt)</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 space-y-5">
          {activity.lib && (
            <div className="rounded-md border border-[#F2B01E]/40 bg-[#F2B01E]/10 text-[#F2B01E] px-3 py-2 text-sm">
              Install <code className="font-mono">{activity.lib}</code> first: Sketch → Include Library → Add .ZIP Library
            </div>
          )}

          <section>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Goal</div>
            <p className="text-sm text-secondary-foreground">{activity.goal}</p>
          </section>

          {activity.materials.length > 0 && (
            <section>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Materials</div>
              <div className="flex flex-wrap gap-1.5">
                {activity.materials.map((m, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-1 rounded border border-panel-border bg-white/[0.03]">{m}</span>
                ))}
              </div>
            </section>
          )}

          {activity.wiring.length > 0 && (
            <section>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Wiring</div>
              <div className="rounded-md border border-panel-border overflow-hidden">
                {activity.wiring.map(([a, b], i) => (
                  <div key={i} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 text-sm ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                    <div className="font-mono text-secondary-foreground">{a}</div>
                    <div className="text-primary">→</div>
                    <div className="font-mono text-secondary-foreground">{b}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {imgOk && (
            <img
              src={`/diagrams/${activity.id}.jpg`}
              alt=""
              onError={() => setImgOk(false)}
              className="rounded-md border border-panel-border max-w-full"
            />
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Code</div>
              <button onClick={copyCode}
                className="text-xs font-mono px-2.5 py-1 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <pre className="text-xs font-mono leading-relaxed bg-black/60 border border-panel-border rounded-md p-3 overflow-x-auto text-secondary-foreground">
{activity.code}
            </pre>
          </section>

          {activity.test.length > 0 && (
            <section>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">What should happen</div>
              <ul className="space-y-1">
                {activity.test.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><span className="text-primary mt-0.5">▸</span><span className="text-secondary-foreground">{t}</span></li>
                ))}
              </ul>
            </section>
          )}

          {activity.trouble.length > 0 && (
            <section>
              <button onClick={() => setTroubleOpen(o => !o)}
                className="w-full text-left text-sm px-3 py-2 rounded border border-[#E5484D]/30 bg-[#E5484D]/5 hover:bg-[#E5484D]/10 flex items-center justify-between">
                <span className="font-mono uppercase tracking-wider text-[11px] text-[#E5484D]">It's not working — troubleshooter</span>
                <span className="text-[#E5484D]">{troubleOpen ? "−" : "+"}</span>
              </button>
              {troubleOpen && (
                <ul className="mt-2 space-y-1 px-1">
                  {activity.trouble.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="text-[#E5484D] mt-0.5">▸</span><span className="text-secondary-foreground">{t}</span></li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Persistent help bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-panel-border bg-[#0b0b10]/95 backdrop-blur px-2 py-2">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(WIRE) as HelpType[]).map(k => {
            const w = WIRE[k];
            const isNotified = notified === k;
            return (
              <button key={k} onClick={() => sendHelp(k)}
                className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors border flex items-center justify-center gap-2"
                style={{
                  background: isNotified ? `${w.color}22` : `${w.color}14`,
                  borderColor: `${w.color}66`,
                  color: w.color,
                }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
                <span>{isNotified ? "instructor notified ✓" : w.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
