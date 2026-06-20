import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRICULUM, WIRE, COHORT, GROUP_COUNT, type HelpType } from "./curriculum";

type HelpRow = {
  id: string;
  cohort: string;
  group_no: number;
  type: HelpType;
  activity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};
type ProgRow = { cohort: string; group_no: number; activity: string; updated_at: string };

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtMS = (sec: number) => `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;
const WAIT_ALERT = 180;

export default function InstructorDashboard() {
  const [requests, setRequests] = useState<HelpRow[]>([]);
  const [progress, setProgress] = useState<Record<number, ProgRow>>({});
  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1Hz tick for waiting timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load + realtime subscription
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: reqs }, { data: progs }] = await Promise.all([
        supabase.from("help_requests").select("*")
          .eq("cohort", COHORT).eq("status", "open").order("created_at", { ascending: true }),
        supabase.from("group_progress").select("*").eq("cohort", COHORT),
      ]);
      if (cancelled) return;
      setRequests((reqs ?? []) as HelpRow[]);
      const map: Record<number, ProgRow> = {};
      (progs ?? []).forEach((p: any) => { map[p.group_no] = p as ProgRow; });
      setProgress(map);
    })();

    const channel = supabase
      .channel("epic-classroom")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "help_requests", filter: `cohort=eq.${COHORT}` },
        (payload) => {
          setRequests(curr => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as HelpRow;
              if (row.status !== "open") return curr;
              if (curr.some(r => r.id === row.id)) return curr;
              // sound + flash
              setFlashId(row.id);
              setTimeout(() => setFlashId(id => id === row.id ? null : id), 1600);
              if (soundOn) beep(audioCtxRef.current);
              return [...curr, row].sort((a, b) => a.created_at.localeCompare(b.created_at));
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as HelpRow;
              if (row.status === "open") {
                const exists = curr.some(r => r.id === row.id);
                return exists ? curr.map(r => r.id === row.id ? row : r)
                              : [...curr, row].sort((a, b) => a.created_at.localeCompare(b.created_at));
              }
              return curr.filter(r => r.id !== row.id);
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as HelpRow;
              return curr.filter(r => r.id !== old.id);
            }
            return curr;
          });
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "group_progress", filter: `cohort=eq.${COHORT}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as ProgRow;
            setProgress(curr => { const next = { ...curr }; delete next[old.group_no]; return next; });
          } else {
            const row = payload.new as ProgRow;
            setProgress(curr => ({ ...curr, [row.group_no]: row }));
          }
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [soundOn]);

  const enableSound = () => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    audioCtxRef.current?.resume?.();
    setSoundOn(s => !s);
  };

  const resolve = async (id: string) => {
    setRequests(curr => curr.filter(r => r.id !== id));
    await supabase.from("help_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
  };

  const waiting = requests.length;
  const longest = requests.length
    ? Math.max(...requests.map(r => Math.floor((now - new Date(r.created_at).getTime()) / 1000)))
    : 0;

  // Map activity title -> index in full sequence (for progress bar)
  const activityIndex = useMemo(() => {
    const m: Record<string, number> = {};
    CURRICULUM.forEach((a, i) => { m[a.title] = i; });
    return m;
  }, []);

  // Group -> open request color (if any)
  const groupOpenColor = useMemo(() => {
    const m: Record<number, string> = {};
    requests.forEach(r => {
      if (!m[r.group_no]) m[r.group_no] = WIRE[r.type]?.color ?? "#888";
    });
    return m;
  }, [requests]);

  return (
    <div className="min-h-screen bg-[#09090D] text-foreground">
      <header className="border-b border-panel-border bg-[#0b0b10] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">EPIC 2026 · Instructor</div>
            <h1 className="text-base font-semibold">Lab Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Stat label="WAITING" value={String(waiting)} />
            <Stat label="LONGEST" value={fmtMS(longest)} alert={longest > WAIT_ALERT} />
            <button onClick={enableSound}
              className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
              SOUND {soundOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid md:grid-cols-2 gap-6">
        {/* Queue */}
        <section>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Help Queue</div>
          {requests.length === 0 ? (
            <div className="rounded-md border border-panel-border bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
              All clear. No open requests.
            </div>
          ) : (
            <ul className="space-y-2">
              {requests.map(r => {
                const w = WIRE[r.type] ?? { color: "#888", label: r.type };
                const waitSec = Math.floor((now - new Date(r.created_at).getTime()) / 1000);
                const past = waitSec > WAIT_ALERT;
                const flash = flashId === r.id;
                return (
                  <li key={r.id}
                    className="rounded-md border p-3 transition-all"
                    style={{
                      borderColor: past ? w.color : "hsl(var(--panel-border, 220 13% 18%))",
                      background: flash ? `${w.color}22` : past ? `${w.color}10` : "rgba(255,255,255,.02)",
                    }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-sm px-2 py-0.5 rounded border border-panel-border bg-black/30">
                          GROUP {pad2(r.group_no)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: w.color }}>
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
                          {w.label}
                        </span>
                      </div>
                      <span className="font-mono text-sm" style={{ color: past ? w.color : "var(--muted-foreground, #888)" }}>
                        {fmtMS(waitSec)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-secondary-foreground truncate">{r.activity}</div>
                    <div className="mt-2 flex justify-end">
                      <button onClick={() => resolve(r.id)}
                        className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
                        Resolve
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Progress board */}
        <section>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Group Progress</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: GROUP_COUNT }, (_, i) => i + 1).map(g => {
              const p = progress[g];
              const dot = groupOpenColor[g] ?? WIRE.done.color;
              const idx = p ? activityIndex[p.activity] ?? -1 : -1;
              const pct = idx >= 0 ? ((idx + 1) / CURRICULUM.length) * 100 : 0;
              return (
                <div key={g} className="rounded-md border border-panel-border bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-mono text-xs">G{pad2(g)}</div>
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
                  </div>
                  <div className="text-[11px] text-secondary-foreground min-h-[2.4em] leading-tight">
                    {p?.activity ?? "—"}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: "hsl(var(--primary))" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-mono text-muted-foreground">
            {(Object.keys(WIRE) as HelpType[]).map(k => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: WIRE[k].color }} />
                {WIRE[k].label}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm ${alert ? "text-[#E5484D]" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.start(t); o.stop(t + 0.24);
  } catch {}
}
