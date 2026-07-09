import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRICULUM, DAY_TITLES, WIRE, GROUP_COUNT, type Activity, type HelpType } from "./curriculum";
import { readCohort, writeCohort, COHORTS, COHORT_LABEL, type Cohort } from "./cohort";

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
const SILENT_FLOOR_SEC = 8 * 60;
const SILENT_MULT = 2;

// Soft pacing hint per day for the run-of-show (static reference, not a timer).
const DAY_HINT: Record<number, string> = {
  1: "~2 hrs",
  2: "~2 hrs",
  3: "~1.5 hrs",
  4: "~2 hrs",
};

const URGENCY: Record<HelpType, number> = {
  not_working: 4,
  wiring: 3,
  question: 2,
  done: 1,
};

export default function InstructorDashboard() {
  const [cohort, setCohort] = useState<Cohort>(() => readCohort());
  const [requests, setRequests] = useState<HelpRow[]>([]);
  const [history, setHistory] = useState<HelpRow[]>([]);
  const [progress, setProgress] = useState<Record<number, ProgRow>>({});
  const [roster, setRoster] = useState<Record<number, string[]>>({});
  // Per-group set of completed activity ids - the server record behind
  // "restore progress" so a group can be brought back to where they were
  // after a lost device or a wiped browser.
  const [groupCompleted, setGroupCompleted] = useState<Record<number, Set<string>>>({});
  const [restoreGroup, setRestoreGroup] = useState<number | null>(null);
  const [restoreBusy, setRestoreBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "today" | "friction">("live");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Switch cohort: empty the room immediately, then the effect below reloads
  // fresh data + re-subscribes scoped to the new cohort.
  const changeCohort = (c: Cohort) => {
    if (c === cohort) return;
    writeCohort(c);
    setRequests([]); setHistory([]); setProgress({}); setRoster({});
    setCohort(c);
  };

  // Initial load + realtime (re-runs on cohort switch). Realtime is the fast
  // path; a short poll underneath is the fallback for when a channel silently
  // drops - that's what "I have to manually refresh to see the queue" is.
  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      const [{ data: reqs }, { data: progs }, { data: hist }, { data: rost }, { data: comp }] = await Promise.all([
        supabase.from("help_requests").select("*")
          .eq("cohort", cohort).eq("status", "open").order("created_at", { ascending: true }),
        supabase.from("group_progress").select("*").eq("cohort", cohort),
        supabase.from("help_requests").select("*").eq("cohort", cohort),
        (supabase as any).from("group_roster").select("*").eq("cohort", cohort),
        (supabase as any).from("group_completed").select("group_no, activity_id").eq("cohort", cohort),
      ]);
      if (cancelled) return;
      setRequests((reqs ?? []) as HelpRow[]);
      setHistory((hist ?? []) as HelpRow[]);
      const map: Record<number, ProgRow> = {};
      (progs ?? []).forEach((p: any) => { map[p.group_no] = p as ProgRow; });
      setProgress(map);
      const rmap: Record<number, string[]> = {};
      (rost ?? []).forEach((r: any) => { rmap[r.group_no] = (r.members as string[]) ?? []; });
      setRoster(rmap);
      const cmap: Record<number, Set<string>> = {};
      (comp ?? []).forEach((c: any) => { (cmap[c.group_no] ||= new Set()).add(c.activity_id); });
      setGroupCompleted(cmap);
    };
    loadAll();
    const poll = setInterval(loadAll, 5000);

    const channel = supabase
      .channel(`epic-classroom-${cohort}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "help_requests", filter: `cohort=eq.${cohort}` },
        (payload) => {
          // history: keep every inserted/updated row
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as HelpRow;
            setHistory(curr => {
              const i = curr.findIndex(r => r.id === row.id);
              if (i === -1) return [...curr, row];
              const next = curr.slice(); next[i] = row; return next;
            });
          }
          // open queue
          setRequests(curr => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as HelpRow;
              if (row.status !== "open") return curr;
              if (curr.some(r => r.id === row.id)) return curr;
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
        { event: "*", schema: "public", table: "group_progress", filter: `cohort=eq.${cohort}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as ProgRow;
            setProgress(curr => { const next = { ...curr }; delete next[old.group_no]; return next; });
          } else {
            const row = payload.new as ProgRow;
            setProgress(curr => ({ ...curr, [row.group_no]: row }));
          }
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "group_roster", filter: `cohort=eq.${cohort}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { group_no: number };
            setRoster(curr => { const next = { ...curr }; delete next[old.group_no]; return next; });
          } else {
            const row = payload.new as { group_no: number; members: string[] };
            setRoster(curr => ({ ...curr, [row.group_no]: row.members ?? [] }));
          }
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "group_completed", filter: `cohort=eq.${cohort}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { group_no: number; activity_id: string };
          if (!row) return;
          setGroupCompleted(curr => {
            const next = { ...curr };
            const set = new Set(next[row.group_no] ?? []);
            if (payload.eventType === "DELETE") set.delete(row.activity_id);
            else set.add(row.activity_id);
            next[row.group_no] = set;
            return next;
          });
        })
      .subscribe();

    return () => { cancelled = true; clearInterval(poll); supabase.removeChannel(channel); };
  }, [soundOn, cohort]);

  // Copyable per-cohort student link, e.g. https://amogh.site/epic?cohort=week2.
  // Built from the live origin so it's correct on whatever domain is serving.
  const studentLink = `${typeof window !== "undefined" ? window.location.origin : ""}/epic?cohort=${cohort}`;
  const copyStudentLink = async () => {
    try { await navigator.clipboard.writeText(studentLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500); } catch {}
  };

  // "Maya R., Devin K." for a group, or "" when no roster yet.
  const names = (g: number) => {
    const m = roster[g];
    return m && m.length ? m.join(", ") : "";
  };

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

  // Resolve every open request at once (clears a cluttered board mid-session).
  const clearQueue = async () => {
    if (!requests.length || !confirm(`Resolve all ${requests.length} open request(s)?`)) return;
    const ids = requests.map(r => r.id);
    setRequests([]);
    await supabase.from("help_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .in("id", ids);
  };

  // Hard reset: wipe ALL data for this cohort - requests, progress, rosters.
  // Use it to start a fresh session / new groups (the cohort label can be reused).
  const resetCohort = async () => {
    if (!confirm(`Reset ${COHORT_LABEL[cohort]}? This permanently clears all help requests, progress, rosters, and completed-activity records for this cohort. Use it to start a fresh session with new groups.`)) return;
    setResetting(true);
    await Promise.all([
      supabase.from("help_requests").delete().eq("cohort", cohort),
      supabase.from("group_progress").delete().eq("cohort", cohort),
      (supabase as any).from("group_roster").delete().eq("cohort", cohort),
      (supabase as any).from("group_completed").delete().eq("cohort", cohort),
    ]);
    setRequests([]); setHistory([]); setProgress({}); setRoster({}); setGroupCompleted({});
    setResetting(false);
  };

  // Restore-progress checklist: instructor ticks/unticks any activity for a
  // group, directly writing the server record a lost/wiped device would
  // otherwise need to replay live to rebuild.
  const toggleGroupActivity = async (g: number, activityId: string) => {
    const already = groupCompleted[g]?.has(activityId);
    const key = `${g}:${activityId}`;
    setRestoreBusy(key);
    setGroupCompleted(curr => {
      const next = { ...curr };
      const set = new Set(next[g] ?? []);
      already ? set.delete(activityId) : set.add(activityId);
      next[g] = set;
      return next;
    });
    if (already) {
      await (supabase as any).from("group_completed")
        .delete().eq("cohort", cohort).eq("group_no", g).eq("activity_id", activityId);
    } else {
      await (supabase as any).from("group_completed")
        .insert({ cohort, group_no: g, activity_id: activityId });
    }
    setRestoreBusy(curr => curr === key ? null : curr);
  };

  const sendBroadcast = async () => {
    const msg = broadcastMsg.trim();
    if (!msg) return;
    setBroadcastSending(true);
    const { error } = await supabase.from("broadcasts").insert({ cohort, message: msg });
    setBroadcastSending(false);
    if (!error) {
      setBroadcastMsg("");
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 1800);
    }
  };

  // Broadcast composer - reused on both Live and Today tabs.
  const renderBroadcast = () => (
    <section className="rounded-md border border-panel-border bg-white/[0.02] p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Broadcast to all groups</div>
      <div className="flex gap-2">
        <input
          value={broadcastMsg}
          onChange={(e) => setBroadcastMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendBroadcast(); }}
          placeholder="e.g. 5 min warning - wrap up your current step"
          className="flex-1 bg-black/40 border border-panel-border rounded px-3 py-2 text-sm focus:outline-none focus:border-[#2D7FF9]/60"
        />
        <button onClick={sendBroadcast} disabled={!broadcastMsg.trim() || broadcastSending}
          className="text-xs font-mono px-3 py-2 rounded border border-[#2D7FF9]/40 text-[#2D7FF9] bg-[#2D7FF9]/10 hover:bg-[#2D7FF9]/20 disabled:opacity-50">
          {broadcastSent ? "Sent ✓" : broadcastSending ? "..." : "Send"}
        </button>
      </div>
    </section>
  );

  // ── derived: silent strugglers + triage ──────────────────────────────
  const activityIndex = useMemo(() => {
    const m: Record<string, number> = {};
    CURRICULUM.forEach((a, i) => { m[a.title] = i; });
    return m;
  }, []);

  const groupHasOpen = useMemo(() => {
    const s = new Set<number>();
    requests.forEach(r => s.add(r.group_no));
    return s;
  }, [requests]);

  const groupTimes = useMemo(() => {
    // seconds-on-current-activity for every group with progress
    const m: Record<number, number> = {};
    Object.values(progress).forEach(p => {
      m[p.group_no] = Math.max(0, Math.floor((now - new Date(p.updated_at).getTime()) / 1000));
    });
    return m;
  }, [progress, now]);

  const roomMedianSec = useMemo(() => {
    const arr = Object.values(groupTimes).sort((a, b) => a - b);
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
  }, [groupTimes]);

  const silentStrugglers = useMemo(() => {
    const out: { group_no: number; activity: string; sec: number; ratio: number }[] = [];
    Object.values(progress).forEach(p => {
      if (groupHasOpen.has(p.group_no)) return;
      const sec = groupTimes[p.group_no] ?? 0;
      if (sec < SILENT_FLOOR_SEC) return;
      if (roomMedianSec <= 0) return;
      const ratio = sec / roomMedianSec;
      if (ratio >= SILENT_MULT) {
        out.push({ group_no: p.group_no, activity: p.activity, sec, ratio });
      }
    });
    return out.sort((a, b) => b.ratio - a.ratio);
  }, [progress, groupHasOpen, groupTimes, roomMedianSec]);

  type Triaged = { kind: "request"; req: HelpRow; score: number; waitSec: number }
               | { kind: "silent"; group_no: number; activity: string; score: number; sec: number };

  const triaged: Triaged[] = useMemo(() => {
    const items: Triaged[] = requests.map(r => {
      const waitSec = Math.floor((now - new Date(r.created_at).getTime()) / 1000);
      const score = URGENCY[r.type] * (1 + (waitSec / 60) / 3);
      return { kind: "request", req: r, score, waitSec };
    });
    silentStrugglers.forEach(s => {
      const score = 3.5 * (1 + (s.sec / 60) / 3);
      items.push({ kind: "silent", group_no: s.group_no, activity: s.activity, score, sec: s.sec });
    });
    return items.sort((a, b) => b.score - a.score);
  }, [requests, silentStrugglers, now]);

  const topPick = triaged[0];

  // ── friction report (history) ────────────────────────────────────────
  const friction = useMemo(() => {
    const byAct: Record<string, { count: number; red: number; waitTotal: number; waitCount: number }> = {};
    history.forEach(r => {
      const bin = byAct[r.activity] ||= { count: 0, red: 0, waitTotal: 0, waitCount: 0 };
      bin.count++;
      if (r.type === "not_working") bin.red++;
      if (r.resolved_at) {
        const w = (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 1000;
        if (w >= 0 && w < 60 * 60 * 4) { bin.waitTotal += w; bin.waitCount++; }
      }
    });
    return Object.entries(byAct)
      .map(([activity, b]) => ({
        activity,
        count: b.count,
        redPct: b.count ? Math.round((b.red / b.count) * 100) : 0,
        avgWait: b.waitCount ? Math.round(b.waitTotal / b.waitCount) : 0,
        score: b.count + b.red * 0.5,
      }))
      .sort((a, b) => b.score - a.score);
  }, [history]);

  // Run-of-show: curriculum grouped by day (static reference).
  const byDay = useMemo(() => {
    const m: Record<number, Activity[]> = {};
    CURRICULUM.forEach(a => { (m[a.day] ||= []).push(a); });
    return m;
  }, []);

  const waiting = requests.length;
  const longest = requests.length
    ? Math.max(...requests.map(r => Math.floor((now - new Date(r.created_at).getTime()) / 1000)))
    : 0;

  const groupOpenColor = useMemo(() => {
    const m: Record<number, string> = {};
    requests.forEach(r => { if (!m[r.group_no]) m[r.group_no] = WIRE[r.type]?.color ?? "#888"; });
    return m;
  }, [requests]);

  const silentSet = useMemo(() => new Set(silentStrugglers.map(s => s.group_no)), [silentStrugglers]);

  return (
    <div className="min-h-screen bg-[#09090D] text-foreground">
      <header className="border-b border-panel-border bg-[#0b0b10] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">EPIC 2026 · Instructor</div>
            <h1 className="text-base font-semibold">Lab Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Cohort</span>
              <select value={cohort} onChange={(e) => changeCohort(e.target.value as Cohort)}
                className="text-xs font-mono px-2 py-1.5 rounded border border-panel-border bg-black/40 hover:bg-white/[0.05] focus:outline-none focus:border-primary/60">
                {COHORTS.map(c => <option key={c} value={c} className="bg-[#0b0b10]">{COHORT_LABEL[c]}</option>)}
              </select>
            </label>
            <button onClick={copyStudentLink} title={studentLink}
              className="text-xs font-mono px-3 py-1.5 rounded border border-[#2D7FF9]/40 text-[#2D7FF9] bg-[#2D7FF9]/10 hover:bg-[#2D7FF9]/20">
              {linkCopied ? "Link copied ✓" : "Copy student link"}
            </button>
            <Stat label="WAITING" value={String(waiting)} />
            <Stat label="LONGEST" value={fmtMS(longest)} alert={longest > WAIT_ALERT} />
            <Stat label="MEDIAN" value={fmtMS(roomMedianSec)} />
            <button onClick={enableSound}
              className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
              SOUND {soundOn ? "ON" : "OFF"}
            </button>
            <button onClick={resetCohort} disabled={resetting} title="Wipe this cohort's requests, progress, and rosters"
              className="text-xs font-mono px-3 py-1.5 rounded border border-[#E5484D]/40 text-[#E5484D] bg-[#E5484D]/10 hover:bg-[#E5484D]/20 disabled:opacity-50">
              {resetting ? "Resetting…" : "Reset cohort"}
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-3 flex gap-1">
          {(["live", "today", "friction"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-t border-b-2 transition-colors ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "live" ? "Live" : t === "today" ? "Today" : "Friction Report"}
            </button>
          ))}
        </div>
      </header>

      {tab === "live" ? (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          {/* TOP PICK */}
          {topPick && (
            <section className="rounded-md border border-primary/40 bg-primary/[0.06] p-4 transition-all">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">▶ Go here next</div>
              {topPick.kind === "request" ? (
                <TopPickRequest req={topPick.req} waitSec={topPick.waitSec} names={names(topPick.req.group_no)} onResolve={() => resolve(topPick.req.id)} />
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-base font-semibold">
                      Group {pad2(topPick.group_no)} - silent struggler
                      {names(topPick.group_no) && <span className="text-secondary-foreground font-normal text-sm"> · {names(topPick.group_no)}</span>}
                    </div>
                    <div className="text-xs text-secondary-foreground mt-0.5">
                      {fmtMS(topPick.sec)} on {topPick.activity} · hasn't asked
                    </div>
                  </div>
                  <span className="font-mono text-xs px-2 py-1 rounded border border-[#F2B01E]/40 text-[#F2B01E] bg-[#F2B01E]/10">CHECK IN</span>
                </div>
              )}
            </section>
          )}

          {/* SILENT STRUGGLERS LANE */}
          {silentStrugglers.length > 0 && (
            <section>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Needs a check-in</div>
              <ul className="space-y-2">
                {silentStrugglers.map(s => (
                  <li key={s.group_no}
                    className="rounded-md border border-[#F2B01E]/40 bg-[#F2B01E]/[0.06] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm">
                        <span className="font-mono">Group {pad2(s.group_no)}</span>
                        {names(s.group_no) && <span className="text-secondary-foreground"> · {names(s.group_no)}</span>}
                        <span className="text-muted-foreground"> - </span>
                        <span className="text-secondary-foreground">{Math.round(s.sec / 60)} min on {s.activity}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {s.ratio.toFixed(1)}× room median · hasn't asked
                      </div>
                    </div>
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#F2B01E" }} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* BROADCAST */}
          {renderBroadcast()}

          {/* QUEUE (smart triage order) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Help queue · smart triage</div>
              {requests.length > 0 && (
                <button onClick={clearQueue}
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-panel-border text-muted-foreground hover:text-foreground hover:bg-white/[0.05]">
                  Clear queue
                </button>
              )}
            </div>
            {requests.length === 0 ? (
              <div className="rounded-md border border-panel-border bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
                All clear. No open requests.
              </div>
            ) : (
              <ul className="space-y-2">
                {triaged.filter((t): t is Extract<Triaged, { kind: "request" }> => t.kind === "request").map(t => {
                  const r = t.req;
                  const w = WIRE[r.type] ?? { color: "#888", label: r.type };
                  const past = t.waitSec > WAIT_ALERT;
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
                          {fmtMS(t.waitSec)}
                        </span>
                      </div>
                      {names(r.group_no) && <div className="mt-1 text-[11px] text-muted-foreground truncate">{names(r.group_no)}</div>}
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

          {/* PROGRESS BOARD */}
          <section>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Group progress</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from({ length: GROUP_COUNT }, (_, i) => i + 1).map(g => {
                const p = progress[g];
                const dot = groupOpenColor[g] ?? WIRE.done.color;
                const idx = p ? activityIndex[p.activity] ?? -1 : -1;
                const pct = idx >= 0 ? ((idx + 1) / CURRICULUM.length) * 100 : 0;
                const isSilent = silentSet.has(g);
                return (
                  <div key={g}
                    className="rounded-md border p-2.5 transition-all"
                    style={{
                      borderColor: isSilent ? "#F2B01E" : "hsl(var(--panel-border, 220 13% 18%))",
                      background: isSilent ? "rgba(242,176,30,0.06)" : "rgba(255,255,255,0.02)",
                      boxShadow: isSilent ? "0 0 0 1px rgba(242,176,30,0.25)" : undefined,
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-mono text-xs">G{pad2(g)}</div>
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
                    </div>
                    {names(g) && <div className="text-[10px] text-muted-foreground truncate mb-0.5">{names(g)}</div>}
                    <div className="text-[11px] text-secondary-foreground min-h-[2.4em] leading-tight">
                      {p?.activity ?? "-"}
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                      {p ? fmtMS(groupTimes[g] ?? 0) : ""}
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${pct}%`, background: "hsl(var(--primary))" }} />
                    </div>
                    <button onClick={() => setRestoreGroup(g)}
                      className="mt-2 w-full text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-panel-border text-muted-foreground hover:text-foreground hover:bg-white/[0.05]">
                      Restore progress
                    </button>
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
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#F2B01E" }} />
                Silent struggler
              </span>
            </div>
          </section>
        </div>
      ) : tab === "today" ? (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          {/* Pace the room from the same view */}
          {renderBroadcast()}

          <section>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Run of show</div>
            <div className="text-xs text-secondary-foreground mb-3">The 4-day plan at a glance. Optional activities are flexible if you're short on time.</div>
            <div className="space-y-4">
              {Object.keys(DAY_TITLES).map(k => {
                const day = Number(k);
                const acts = byDay[day] ?? [];
                return (
                  <div key={day} className="rounded-md border border-panel-border overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-panel-border">
                      <div className="text-sm font-medium">{DAY_TITLES[day]}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{acts.length} activities · {DAY_HINT[day] ?? ""}</div>
                    </div>
                    <ul>
                      {acts.map((a, i) => (
                        <li key={a.id} className={`flex items-center gap-3 px-3 py-2 text-sm ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                          <span className="font-mono text-[10px] text-muted-foreground w-20 shrink-0">{a.lesson}</span>
                          <span className="text-secondary-foreground flex-1">{a.title}</span>
                          {a.optional && <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded border border-panel-border">optional</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Friction report</div>
                <div className="text-xs text-secondary-foreground">Activities ranked by total trouble - copy-ready for the post-mortem.</div>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(friction.map(f =>
                  `${f.activity} - ${f.count} requests, ${f.redPct}% stuck, avg wait ${fmtMS(f.avgWait)}`
                ).join("\n"))}
                className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
                Copy
              </button>
            </div>
            {friction.length === 0 ? (
              <div className="rounded-md border border-panel-border bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
                No help requests recorded yet.
              </div>
            ) : (
              <ul className="rounded-md border border-panel-border overflow-hidden">
                <li className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                  <span>Activity</span><span>Requests</span><span>% Stuck</span><span>Avg wait</span>
                </li>
                {friction.map((f, i) => (
                  <li key={f.activity}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 py-2.5 text-sm items-center ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                    <span className="text-secondary-foreground truncate">{f.activity}</span>
                    <span className="font-mono text-right w-14">{f.count}</span>
                    <span className="font-mono text-right w-14" style={{ color: f.redPct >= 50 ? "#E5484D" : undefined }}>{f.redPct}%</span>
                    <span className="font-mono text-right w-16">{fmtMS(f.avgWait)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Restore-progress checklist - tick/untick any activity to bring a
          group back to where they were after a lost device or wiped browser. */}
      {restoreGroup != null && (
        <div className="fixed inset-0 z-50 bg-[#09090D]/90 backdrop-blur flex items-center justify-center p-4">
          <div className="fx-glass fx-card w-full max-w-lg max-h-[85vh] flex flex-col rounded-lg border border-panel-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border">
              <div>
                <h2 className="text-base font-semibold">Restore progress - Group {pad2(restoreGroup)}</h2>
                {names(restoreGroup) && <div className="text-xs text-muted-foreground">{names(restoreGroup)}</div>}
              </div>
              <button onClick={() => setRestoreGroup(null)}
                className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
                Done
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-4">
              <p className="text-xs text-secondary-foreground px-1">
                Check off whatever this group has already completed. This writes straight to the server, so their
                helper page picks it up immediately - even on a brand new device.
              </p>
              {Object.keys(DAY_TITLES).map(k => {
                const day = Number(k);
                const acts = byDay[day] ?? [];
                return (
                  <div key={day}>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 px-1">{DAY_TITLES[day]}</div>
                    <ul className="space-y-1">
                      {acts.map(a => {
                        const done = groupCompleted[restoreGroup]?.has(a.id) ?? false;
                        const busy = restoreBusy === `${restoreGroup}:${a.id}`;
                        return (
                          <li key={a.id}>
                            <button
                              onClick={() => toggleGroupActivity(restoreGroup, a.id)}
                              disabled={busy}
                              className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded border transition-colors disabled:opacity-60 ${
                                done ? "border-[#30A46C]/40 bg-[#30A46C]/[0.07]" : "border-panel-border bg-white/[0.02] hover:bg-white/[0.05]"
                              }`}>
                              <span className={`inline-flex items-center justify-center w-4 h-4 rounded border text-[10px] shrink-0 ${
                                done ? "border-[#30A46C] text-[#30A46C]" : "border-panel-border text-transparent"
                              }`}>✓</span>
                              <span className="font-mono text-[10px] text-muted-foreground shrink-0">{a.lesson}</span>
                              <span className={`text-sm truncate ${done ? "text-muted-foreground" : "text-secondary-foreground"}`}>{a.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopPickRequest({ req, waitSec, names, onResolve }: { req: HelpRow; waitSec: number; names: string; onResolve: () => void }) {
  const w = WIRE[req.type] ?? { color: "#888", label: req.type };
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="text-base font-semibold flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
          Group {pad2(req.group_no)} - {w.label}
          {names && <span className="text-secondary-foreground font-normal text-sm">· {names}</span>}
        </div>
        <div className="text-xs text-secondary-foreground mt-0.5 truncate">
          {req.activity} · waiting {fmtMS(waitSec)}
        </div>
      </div>
      <button onClick={onResolve}
        className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.04] hover:bg-white/[0.08]">
        Resolve
      </button>
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
