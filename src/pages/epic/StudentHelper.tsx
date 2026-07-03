import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRICULUM, DAY_TITLES, WIRE, GROUP_COUNT, THANKYOU_EMAIL, FIRST_AID, type Activity, type HelpType } from "./curriculum";
import { isUnlocked, additionalsUntil, gatingActive, type Completed } from "./progress";
import { readCohort, COHORT_LABEL } from "./cohort";

const LS_GROUP = "epic_group";
const LS_SETUP = "epic_setup_done";
const pad2 = (n: number) => String(n).padStart(2, "0");

type Broadcast = { id: string; message: string; created_at: string };

// ── Day-1 station setup (Part 2) ─ self-serve checklist for shared PCs ──────
const SETUP_STEPS: string[] = [
  "Open the Arduino IDE (or install it from arduino.cc/en/software).",
  "Plug in the Arduino with the USB cable — a small light turns on.",
  "Tools → Board → Arduino AVR Boards → Arduino UNO.",
  "Tools → Port → pick the port that appears (often shows \"UNO\").",
  "Paste the Blink code below, click Verify (✓), then Upload (→). Wait for \"Done uploading.\"",
  "Confirm the little \"L\" light blinks. ✅ You're ready.",
];

export default function StudentHelper() {
  // Active cohort is resolved once per session: ?cohort=week2 in the URL wins
  // (and is persisted), otherwise localStorage["epic_cohort"], else week1.
  const [cohort] = useState(() => readCohort());

  const [group, setGroup] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string>("setup");
  const [copied, setCopied] = useState(false);
  const [calCopied, setCalCopied] = useState(false);
  const [setupCopied, setSetupCopied] = useState(false);
  const [troubleOpen, setTroubleOpen] = useState(false);
  const [firstAid, setFirstAid] = useState<boolean[]>([]);   // "before you call a professor" checklist
  const [extOpen, setExtOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [notified, setNotified] = useState<HelpType | null>(null);
  // Check-off gate: when a group asks to be checked off we block moving on
  // until an instructor resolves the request from the dashboard.
  const [awaitingCheck, setAwaitingCheck] = useState<{ id: string; activity: string; activityId: string; createdAt: string } | null>(null);
  const [approved, setApproved] = useState(false);
  // live help queue for THIS cohort (drives "N ahead of you" + resolution toast)
  const [openReqs, setOpenReqs] = useState<{ id: string; group_no: number; type: string; created_at: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const selfResolvedIds = useRef<Set<string>>(new Set());
  const prevGroupOpen = useRef<{ id: string }[]>([]);
  // progressive unlocking: which activities this group has been checked off on
  const [completed, setCompleted] = useState<Completed>({});
  const [now, setNow] = useState(() => Date.now());
  const [imgOk, setImgOk] = useState(true);
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Group roster — first name + last initial ONLY (minors' data).
  const [rosterOpen, setRosterOpen] = useState(false);
  const [members, setMembers] = useState<string[]>(["", "", "", ""]);

  // Wrap-up thank-you step
  const [hope, setHope] = useState("");
  const [thanksName, setThanksName] = useState("");

  // Setup checklist progress (per device).
  const [setupDone, setSetupDone] = useState<boolean[]>(() => {
    try { const r = JSON.parse(localStorage.getItem(LS_SETUP) || "[]"); return Array.isArray(r) ? r : []; }
    catch { return []; }
  });

  const blinkCode = useMemo(() => CURRICULUM.find(a => a.id === "blink")?.code ?? "", []);

  // Load saved group
  useEffect(() => {
    const raw = localStorage.getItem(LS_GROUP);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (n >= 1 && n <= GROUP_COUNT) setGroup(n);
  }, []);

  // Broadcast subscription — newest non-dismissed banner (scoped to cohort)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("broadcasts").select("id,message,created_at")
        .eq("cohort", cohort).order("created_at", { ascending: false }).limit(1);
      if (cancelled) return;
      if (data && data[0]) setBroadcast(data[0] as Broadcast);
    })();
    const ch = supabase
      .channel("epic-broadcasts")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "broadcasts", filter: `cohort=eq.${cohort}` },
        (payload) => setBroadcast(payload.new as Broadcast))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [cohort]);

  const activity = useMemo(
    () => CURRICULUM.find(a => a.id === activeId) ?? CURRICULUM[0],
    [activeId]
  );
  const onSetup = activeId === "setup";
  const onThankYou = activeId === "thankyou";
  // What this group is "on" right now — used for progress + help labels.
  const currentLabel = onSetup ? "Setup" : onThankYou ? "Wrap-up" : activity.title;

  // Reset transient state when activity changes
  useEffect(() => {
    setCopied(false);
    setTroubleOpen(false);
    setFirstAid([]);
    setExtOpen(false);
    setChallengeOpen(false);
    setNotified(null);
    setImgOk(true);
  }, [activeId]);

  // Upsert progress on activity open (scoped to cohort)
  useEffect(() => {
    if (group == null) return;
    supabase.from("group_progress").upsert(
      { cohort, group_no: group, activity: currentLabel, updated_at: new Date().toISOString() },
      { onConflict: "cohort,group_no" }
    ).then(() => {});
  }, [group, currentLabel, cohort]);

  const pickGroup = async (n: number) => {
    localStorage.setItem(LS_GROUP, String(n));
    setGroup(n);
    setRosterOpen(true);
    // Prefill names if this group already has a roster for this cohort.
    const { data } = await (supabase as any).from("group_roster")
      .select("members").eq("cohort", cohort).eq("group_no", n).maybeSingle();
    const existing = ((data as any)?.members as string[] | undefined) ?? [];
    setMembers([0, 1, 2, 3].map(i => existing[i] ?? ""));
  };

  // Save first name + last initial ONLY — never full names, emails, or other PII.
  const saveRoster = async () => {
    if (group == null) return;
    const cleaned = members.map(m => m.trim()).filter(Boolean).slice(0, 4);
    await (supabase as any).from("group_roster").upsert(
      { cohort, group_no: group, members: cleaned, updated_at: new Date().toISOString() },
      { onConflict: "cohort,group_no" }
    );
    setRosterOpen(false);
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(activity.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const copyCalibration = async () => {
    if (!activity.calibration) return;
    try { await navigator.clipboard.writeText(activity.calibration.code); setCalCopied(true); setTimeout(() => setCalCopied(false), 1500); } catch {}
  };
  const copyBlink = async () => {
    try { await navigator.clipboard.writeText(blinkCode); setSetupCopied(true); setTimeout(() => setSetupCopied(false), 1500); } catch {}
  };

  const toggleSetup = (i: number) => setSetupDone(prev => {
    const next = prev.slice(); next[i] = !next[i];
    localStorage.setItem(LS_SETUP, JSON.stringify(next));
    return next;
  });
  const allSetupDone = SETUP_STEPS.every((_, i) => setupDone[i]);

  const sendHelp = async (type: HelpType, label: string = currentLabel) => {
    if (group == null) return;
    // We're about to auto-resolve our own prior request of this type — mark it
    // so it doesn't fire a false "an instructor helped" toast.
    openReqs.filter(r => r.group_no === group && r.type === type).forEach(r => selfResolvedIds.current.add(r.id));
    // Resolve any existing open request of same type+group to avoid duplicates
    await supabase.from("help_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("cohort", cohort).eq("group_no", group).eq("type", type).eq("status", "open");
    await supabase.from("help_requests").insert({
      cohort, group_no: group, type, activity: label,
    });
    setNotified(type);
    setTimeout(() => setNotified(curr => curr === type ? null : curr), 2200);
  };

  // Ask to be checked off → open the blocking "waiting for instructor" gate.
  const requestCheckoff = async () => {
    if (group == null) return;
    const label = currentLabel;
    await supabase.from("help_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("cohort", cohort).eq("group_no", group).eq("type", "done").eq("status", "open");
    const { data } = await supabase.from("help_requests")
      .insert({ cohort, group_no: group, type: "done", activity: label })
      .select("id, created_at").single();
    if (data?.id) { setApproved(false); setAwaitingCheck({ id: data.id, activity: label, activityId: activeId, createdAt: (data as any).created_at }); }
  };

  // Back out of the gate ("not done yet") → withdraw the request from the queue.
  const cancelCheckoff = async () => {
    const pending = awaitingCheck;
    setAwaitingCheck(null); setApproved(false);
    if (pending) await supabase.from("help_requests").delete().eq("id", pending.id);
  };

  // After approval, release the gate and advance to the next activity.
  const continueAfterCheck = () => {
    const idx = CURRICULUM.findIndex(a => a.id === activeId);
    const next = CURRICULUM[idx + 1];
    setAwaitingCheck(null); setApproved(false);
    setActiveId(next ? next.id : "thankyou");
  };

  // While the gate is open, listen for the instructor resolving THIS request.
  useEffect(() => {
    if (!awaitingCheck || approved) return;
    const id = awaitingCheck.id;
    const ch = supabase
      .channel(`epic-checkoff-${id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "help_requests", filter: `id=eq.${id}` },
        (payload) => { if ((payload.new as any)?.status === "resolved") setApproved(true); })
      .subscribe();
    // Fallback poll in case a realtime event is missed.
    const poll = setInterval(async () => {
      const { data } = await supabase.from("help_requests").select("status").eq("id", id).maybeSingle();
      if ((data as any)?.status === "resolved") setApproved(true);
    }, 5000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [awaitingCheck, approved]);

  // Load this group's completed activities (persists all week on this PC).
  useEffect(() => {
    if (group == null) return;
    try { setCompleted(JSON.parse(localStorage.getItem(`epic_completed_${cohort}_${group}`) || "{}")); }
    catch { setCompleted({}); }
  }, [group, cohort]);

  // Clock tick — drives the 22-hour additional-projects window + go-live flip.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // When a check-off is approved, record that activity as completed.
  useEffect(() => {
    if (!approved || !awaitingCheck || group == null) return;
    const aid = awaitingCheck.activityId;
    setCompleted(prev => {
      if (prev[aid]) return prev;
      const next = { ...prev, [aid]: Date.now() };
      localStorage.setItem(`epic_completed_${cohort}_${group}`, JSON.stringify(next));
      return next;
    });
  }, [approved, awaitingCheck, group, cohort]);

  // If the open activity is locked (e.g. once gating goes live), fall back to Setup.
  useEffect(() => {
    if (activeId === "setup" || activeId === "thankyou") return;
    const a = CURRICULUM.find(x => x.id === activeId);
    if (a && !isUnlocked(a, completed, now)) setActiveId("setup");
  }, [activeId, completed, now]);

  // Live cohort help queue → "N ahead of you" + resolution toast.
  useEffect(() => {
    if (group == null) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from("help_requests")
        .select("id, group_no, type, created_at")
        .eq("cohort", cohort).eq("status", "open").order("created_at", { ascending: true });
      if (!cancelled) setOpenReqs((data ?? []) as any);
    };
    load();
    const ch = supabase
      .channel(`epic-student-queue-${cohort}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "help_requests", filter: `cohort=eq.${cohort}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [group, cohort]);

  // Toast when an instructor resolves one of our (non-check-off) requests.
  useEffect(() => {
    if (group == null) return;
    const groupOpen = openReqs.filter(r => r.group_no === group && r.type !== "done");
    prevGroupOpen.current.forEach(p => {
      if (groupOpen.some(g => g.id === p.id)) return;
      if (selfResolvedIds.current.has(p.id)) { selfResolvedIds.current.delete(p.id); return; }
      setToast("An instructor came to help ✅");
    });
    prevGroupOpen.current = groupOpen.map(r => ({ id: r.id }));
  }, [openReqs, group]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // How many open requests are ahead of our pending check-off.
  const checkPosition = useMemo(() => {
    if (!awaitingCheck) return null;
    const mine = new Date(awaitingCheck.createdAt).getTime();
    return openReqs.filter(r => r.id !== awaitingCheck.id && new Date(r.created_at).getTime() < mine).length;
  }, [openReqs, awaitingCheck]);

  // ── Group picker ──────────────────────────────────────────────────────
  if (group == null) {
    return (
      <div className="min-h-screen bg-[#09090D] text-foreground flex items-center justify-center p-6">
        <div className="fx-glass fx-card max-w-md w-full rounded-lg p-6 border border-panel-border">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold">EPIC 2026 — Arduino Lab</h1>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary">{COHORT_LABEL[cohort]}</span>
          </div>
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

  // ── Roster prompt (first name + last initial only) ────────────────────
  if (rosterOpen) {
    return (
      <div className="min-h-screen bg-[#09090D] text-foreground flex items-center justify-center p-6">
        <div className="fx-glass fx-card max-w-md w-full rounded-lg p-6 border border-panel-border">
          <h1 className="text-xl font-semibold mb-1">Who's in Group {pad2(group)}?</h1>
          <p className="text-sm text-muted-foreground mb-4">
            First name and last initial only — like <span className="font-mono">Maya R.</span> Helps your
            instructor know who's who. You can skip this.
          </p>
          <div className="space-y-2 mb-5">
            {[0, 1, 2, 3].map(i => (
              <input
                key={i}
                value={members[i]}
                onChange={(e) => setMembers(m => { const next = m.slice(); next[i] = e.target.value; return next; })}
                placeholder="Maya R."
                maxLength={24}
                className="w-full bg-black/40 border border-panel-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveRoster}
              className="flex-1 rounded-md px-3 py-2.5 text-sm font-medium border border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20">
              Save
            </button>
            <button onClick={() => setRosterOpen(false)}
              className="rounded-md px-4 py-2.5 text-sm font-mono border border-panel-border bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground">
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Group activities by day
  const byDay: Record<number, Activity[]> = {};
  CURRICULUM.forEach(a => { (byDay[a.day] ||= []).push(a); });

  const fmtLeft = (ms: number) => {
    const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const navItem = (a: Activity) => (
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
        {completed[a.id] && <span className="ml-1.5 text-[10px] text-[#30A46C]">✓</span>}
      </button>
    </li>
  );

  return (
    <div className="min-h-screen bg-[#09090D] text-foreground">
      <header className="sticky top-0 z-20 border-b border-panel-border bg-[#0b0b10]/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">EPIC 2026 · Arduino Lab · {COHORT_LABEL[cohort]}</div>
          <h1 className="text-base font-semibold">{currentLabel}</h1>
        </div>
        <button onClick={() => { localStorage.removeItem(LS_GROUP); setGroup(null); }}
          className="text-xs font-mono px-3 py-1.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
          GROUP {pad2(group)} · change
        </button>
      </header>

      {broadcast && dismissedId !== broadcast.id && (
        <div className="sticky top-[57px] z-10 border-b border-[#2D7FF9]/30 bg-[#2D7FF9]/[0.08] px-4 py-2 flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2D7FF9] shrink-0" />
          <div className="flex-1 text-sm text-foreground">{broadcast.message}</div>
          <button onClick={() => setDismissedId(broadcast.id)}
            className="text-[11px] font-mono text-[#2D7FF9] hover:text-foreground px-2 py-0.5">Dismiss</button>
        </div>
      )}


      <div className="flex flex-col md:flex-row max-w-6xl mx-auto pb-32">
        {/* Left nav */}
        <aside className="md:w-64 md:border-r border-panel-border p-3 md:p-4 md:sticky md:top-[60px] md:self-start md:h-[calc(100vh-60px)] md:overflow-y-auto">
          {/* Setup — pinned above Day 1 */}
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Get started</div>
            <ul className="space-y-1">
              <li>
                <button onClick={() => setActiveId("setup")}
                  className={`w-full text-left text-sm px-2.5 py-1.5 rounded border transition-colors ${
                    onSetup
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-transparent hover:bg-white/[0.04] text-secondary-foreground"
                  }`}>
                  <span className="font-mono text-[10px] text-muted-foreground mr-1.5">Setup</span>
                  Get your station ready
                  {allSetupDone && <span className="ml-1.5 text-[10px] text-[#30A46C]">✓</span>}
                </button>
              </li>
            </ul>
          </div>
          {Object.keys(DAY_TITLES).map(k => {
            const day = Number(k);
            const acts = byDay[day] ?? [];
            const gated = gatingActive(now);

            // Additional Exercises — gated behind the 22-hour window once live.
            if (day === 5) {
              const until = additionalsUntil(completed);
              const open = !gated || (until != null && now < until);
              return (
                <div key={day} className="mb-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
                    <span>{DAY_TITLES[day]}</span>
                    {gated && open && until != null && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-[#30A46C]/40 text-[#30A46C]">closes in {fmtLeft(until - now)}</span>
                    )}
                  </div>
                  {open ? (
                    <ul className="space-y-1">{acts.map(navItem)}</ul>
                  ) : (
                    <div className="text-[11px] leading-relaxed text-muted-foreground rounded border border-panel-border bg-white/[0.02] px-2.5 py-2">
                      🔒 Finish today's required activities to unlock the bonus projects — they open for 22 hours.
                    </div>
                  )}
                </div>
              );
            }

            const unlocked = acts.filter(a => isUnlocked(a, completed, now));
            return (
              <div key={day} className="mb-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{DAY_TITLES[day]}</div>
                <ul className="space-y-1">
                  {unlocked.map(navItem)}
                  {gated && unlocked.length < acts.length && (
                    <li className="text-[11px] text-muted-foreground px-2.5 py-1.5">🔒 Check off the activity above to unlock the next</li>
                  )}
                </ul>
              </div>
            );
          })}

          {/* Wrap up — last step */}
          <div className="mb-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Wrap up</div>
            <ul className="space-y-1">
              <li>
                <button onClick={() => setActiveId("thankyou")}
                  className={`w-full text-left text-sm px-2.5 py-1.5 rounded border transition-colors ${
                    onThankYou
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-transparent hover:bg-white/[0.04] text-secondary-foreground"
                  }`}>
                  <span className="font-mono text-[10px] text-muted-foreground mr-1.5">Last</span>
                  🎉 Thank the EPIC team
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 space-y-5">
          {onThankYou ? (
            (() => {
              const ready = hope.trim().length > 3;
              const subject = `Thank you from EPIC 2026 — Group ${pad2(group)}`;
              const body =
                `Dear Professor Kundu and Maria,\n\nThank you for the EPIC 2026 Arduino lab! ` +
                `One thing I'm looking forward to building or doing with what I learned: ${hope.trim() || "..."}.\n\n` +
                `— Group ${group}${thanksName.trim() ? `, ${thanksName.trim()}` : ""}, EPIC 2026`;
              const mailto = `mailto:${THANKYOU_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(THANKYOU_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              const noRecipient = THANKYOU_EMAIL.startsWith("REPLACE_WITH");
              return (
                <>
                  <section>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Last step</div>
                    <h2 className="text-lg font-semibold">Say thanks 🎉</h2>
                    <p className="text-sm text-secondary-foreground mt-1">
                      You built real circuits and wrote real code this week. Send Professor Kundu and Maria
                      a quick thank-you and tell them one thing you want to build or do next with your new skills.
                    </p>
                  </section>
                  <section className="space-y-3 max-w-xl">
                    <label className="block">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Your name(s) — optional</span>
                      <input value={thanksName} onChange={(e) => setThanksName(e.target.value)} placeholder="Maya R. & Devin K."
                        className="mt-1 w-full bg-black/40 border border-panel-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/60" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">One thing I'm looking forward to building or doing</span>
                      <textarea value={hope} onChange={(e) => setHope(e.target.value)} rows={3}
                        placeholder="a robot that avoids walls / a light that turns on when it gets dark..."
                        className="mt-1 w-full bg-black/40 border border-panel-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/60" />
                    </label>
                    <pre className="text-xs font-mono leading-relaxed bg-black/60 border border-panel-border rounded-md p-3 whitespace-pre-wrap text-secondary-foreground">{body}</pre>
                    <div className="flex flex-wrap gap-2">
                      <a href={ready ? mailto : undefined} aria-disabled={!ready}
                        className={`rounded-md px-4 py-2.5 text-sm font-medium border ${ready ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20" : "border-panel-border text-muted-foreground pointer-events-none opacity-50"}`}>
                        Open in email app
                      </a>
                      <a href={ready ? gmail : undefined} target="_blank" rel="noreferrer" aria-disabled={!ready}
                        className={`rounded-md px-4 py-2.5 text-sm font-mono border ${ready ? "border-panel-border bg-white/[0.03] hover:bg-white/[0.07]" : "border-panel-border text-muted-foreground pointer-events-none opacity-50"}`}>
                        Open in Gmail
                      </a>
                    </div>
                    {!ready && <p className="text-[11px] text-muted-foreground">Type one thing above to enable the buttons.</p>}
                    {noRecipient && <p className="text-[11px] text-[#F2B01E]">Instructor: set THANKYOU_EMAIL to Professor Kundu's address in curriculum.ts.</p>}
                  </section>
                </>
              );
            })()
          ) : onSetup ? (
            <>
              <section>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Get your station ready</div>
                <p className="text-sm text-secondary-foreground">
                  Work through these once per computer. Check each step as you go — it's saved on this machine.
                </p>
              </section>

              {allSetupDone && (
                <div className="rounded-md border border-[#30A46C]/40 bg-[#30A46C]/10 text-[#30A46C] px-3 py-2 text-sm font-medium">
                  ✅ Station ready — you can start Day 1.
                </div>
              )}

              <section>
                <ol className="space-y-2">
                  {SETUP_STEPS.map((step, i) => (
                    <li key={i}>
                      <button onClick={() => toggleSetup(i)}
                        className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded border transition-colors ${
                          setupDone[i]
                            ? "border-[#30A46C]/40 bg-[#30A46C]/[0.07]"
                            : "border-panel-border bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}>
                        <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border text-xs shrink-0 ${
                          setupDone[i] ? "border-[#30A46C] text-[#30A46C]" : "border-panel-border text-transparent"
                        }`}>✓</span>
                        <span className="text-sm">
                          <span className="font-mono text-[11px] text-muted-foreground mr-1.5">{i + 1}.</span>
                          <span className={setupDone[i] ? "text-muted-foreground line-through" : "text-secondary-foreground"}>{step}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Blink code</div>
                  <button onClick={copyBlink}
                    className="text-xs font-mono px-2.5 py-1 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07]">
                    {setupCopied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <pre className="text-xs font-mono leading-relaxed bg-black/60 border border-panel-border rounded-md p-3 overflow-x-auto text-secondary-foreground">
{blinkCode}
                </pre>
              </section>

              <section>
                <button onClick={() => sendHelp("not_working", "Setup")}
                  className="w-full md:w-auto rounded-md px-4 py-2.5 text-sm font-medium border flex items-center justify-center gap-2"
                  style={{ background: `${WIRE.not_working.color}14`, borderColor: `${WIRE.not_working.color}66`, color: WIRE.not_working.color }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: WIRE.not_working.color }} />
                  {notified === "not_working" ? "instructor notified ✓" : "Still stuck on setup?"}
                </button>
              </section>
            </>
          ) : (
            <>
              {activity.lib && (
                <div className="rounded-md border border-[#F2B01E]/40 bg-[#F2B01E]/10 text-[#F2B01E] px-3 py-2 text-sm space-y-2">
                  <div>
                    Install <code className="font-mono">{activity.lib}</code> first — in the Arduino IDE, do this:
                  </div>
                  <img
                    src="/diagrams/add_zip_library.jpg"
                    alt="Arduino IDE: Sketch → Include Library → Add .ZIP Library"
                    loading="lazy"
                    width={1280}
                    height={800}
                    className="w-full rounded border border-[#F2B01E]/30"
                  />
                  <a href={`/libraries/${activity.lib}`} download className="inline-flex items-center gap-2 bg-[#F2B01E]/20 hover:bg-[#F2B01E]/30 px-2 py-1 rounded text-xs font-medium transition-colors">
                    ↓ Download {activity.lib}
                  </a>
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
                <figure className="space-y-1">
                  <img
                    src={`/diagrams/${activity.id}.svg`}
                    alt={`Wiring diagram for ${activity.title}`}
                    onError={() => setImgOk(false)}
                    className="rounded-md border border-panel-border max-w-full bg-white"
                  />
                  <figcaption className="text-[11px] text-muted-foreground">Wiring diagram — put each wire and part in the exact hole shown here.</figcaption>
                </figure>
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

              {activity.calibration && (
                <section className="rounded-md border border-[#F2B01E]/40 bg-[#F2B01E]/[0.06] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-[#F2B01E]">⚙ Calibrate the threshold first</div>
                    <button onClick={copyCalibration}
                      className="text-xs font-mono px-2.5 py-1 rounded border border-[#F2B01E]/40 bg-[#F2B01E]/10 hover:bg-[#F2B01E]/20 text-[#F2B01E]">
                      {calCopied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="text-sm text-secondary-foreground mb-2 leading-relaxed">{activity.calibration.note}</p>
                  <pre className="text-xs font-mono leading-relaxed bg-black/60 border border-panel-border rounded-md p-3 overflow-x-auto text-secondary-foreground">
{activity.calibration.code}
                  </pre>
                </section>
              )}

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

              <section>
                <button onClick={() => setTroubleOpen(o => !o)}
                  className="w-full text-left text-sm px-3 py-2.5 rounded border border-[#E5484D]/30 bg-[#E5484D]/5 hover:bg-[#E5484D]/10 flex items-center justify-between">
                  <span className="font-medium text-[#E5484D]">Not working? Try this before calling a professor</span>
                  <span className="text-[#E5484D] text-lg leading-none">{troubleOpen ? "−" : "+"}</span>
                </button>
                {troubleOpen && (
                  <div className="mt-3 space-y-4">
                    {/* Universal first-aid checklist — tick each as you check it */}
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                        Step 1 — check these on ANY project ({firstAid.filter(Boolean).length}/{FIRST_AID.length})
                      </div>
                      <ol className="space-y-1.5">
                        {FIRST_AID.map((step, i) => (
                          <li key={i}>
                            <button onClick={() => setFirstAid(prev => { const n = prev.slice(); n[i] = !n[i]; return n; })}
                              className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded border transition-colors ${
                                firstAid[i] ? "border-[#30A46C]/40 bg-[#30A46C]/[0.06]" : "border-panel-border bg-white/[0.02] hover:bg-white/[0.05]"
                              }`}>
                              <span className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded border text-[10px] shrink-0 ${
                                firstAid[i] ? "border-[#30A46C] text-[#30A46C]" : "border-panel-border text-transparent"
                              }`}>✓</span>
                              <span className={`text-sm ${firstAid[i] ? "text-muted-foreground line-through" : "text-secondary-foreground"}`}>{step}</span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Exercise-specific fixes */}
                    {activity.trouble.length > 0 && (
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Step 2 — for THIS project specifically</div>
                        <ul className="space-y-1 px-1">
                          {activity.trouble.map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm"><span className="text-[#E5484D] mt-0.5">▸</span><span className="text-secondary-foreground">{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground border-t border-panel-border pt-3">
                      Worked through all of this and it's still not right? Now tap the red <span className="text-[#E5484D] font-medium">"It's not working"</span> button below and a professor will come over.
                    </p>
                  </div>
                )}
              </section>

              {/* Extension challenge for fast finishers */}
              {activity.extension && (
                <section>
                  <button onClick={() => setExtOpen(o => !o)}
                    className="w-full text-left text-sm px-3 py-2 rounded border border-[#30A46C]/30 bg-[#30A46C]/5 hover:bg-[#30A46C]/10 flex items-center justify-between">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-[#30A46C]">Done early? Try this</span>
                    <span className="text-[#30A46C]">{extOpen ? "−" : "+"}</span>
                  </button>
                  {extOpen && (
                    <p className="mt-2 px-1 text-sm text-secondary-foreground leading-relaxed">{activity.extension}</p>
                  )}
                </section>
              )}

              {/* Fill-in-the-blank challenge (additional exercises) */}
              {activity.challenge && (
                <section>
                  <button onClick={() => setChallengeOpen(o => !o)}
                    className="w-full text-left text-sm px-3 py-2 rounded border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 flex items-center justify-between">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-violet-400">Challenge: fill in the blanks</span>
                    <span className="text-violet-400">{challengeOpen ? "−" : "+"}</span>
                  </button>
                  {challengeOpen && (
                    <div className="mt-2 space-y-2">
                      <p className="px-1 text-sm text-secondary-foreground leading-relaxed">{activity.challenge.prompt}</p>
                      <pre className="text-xs font-mono leading-relaxed bg-black/60 border border-violet-500/20 rounded-md p-3 overflow-x-auto text-secondary-foreground">
{activity.challenge.code}
                      </pre>
                    </div>
                  )}
                </section>
              )}
            </>
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
              <button key={k} onClick={() => k === "done" ? requestCheckoff() : sendHelp(k)}
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

      {/* Toast: an instructor resolved one of our help requests */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <div className="rounded-full bg-[#0b0b10] border border-[#30A46C]/40 text-[#30A46C] text-sm font-medium px-5 py-2.5 shadow-lg">{toast}</div>
        </div>
      )}

      {/* Check-off gate — blocks moving on until an instructor resolves it */}
      {awaitingCheck && (
        <div className="fixed inset-0 z-50 bg-[#09090D]/95 backdrop-blur flex items-center justify-center p-6">
          <div className="fx-glass fx-card max-w-md w-full text-center rounded-lg border border-panel-border p-8">
            {!approved ? (
              <>
                <div className="text-5xl mb-4">✋</div>
                <h2 className="text-xl font-semibold mb-2">An instructor is coming to check you off</h2>
                <p className="text-sm text-secondary-foreground">Group {pad2(group)} · {awaitingCheck.activity}</p>
                <p className="text-sm text-muted-foreground mt-2 mb-3">
                  Keep your project set up so they can see it. You'll move on automatically once they mark you done.
                </p>
                {checkPosition != null && (
                  <p className="text-sm font-medium text-primary mb-3">
                    {checkPosition === 0 ? "You're next in line." : `${checkPosition} group${checkPosition === 1 ? "" : "s"} ahead of you.`}
                  </p>
                )}
                <div className="flex items-center justify-center gap-1.5 mb-6">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <button onClick={cancelCheckoff}
                  className="text-sm font-mono px-4 py-2.5 rounded border border-panel-border bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground">
                  ← We're not done yet — go back
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-semibold mb-2 text-[#30A46C]">Checked off — nice work!</h2>
                <p className="text-sm text-secondary-foreground mb-6">
                  An instructor approved <span className="font-medium">{awaitingCheck.activity}</span>. Ready for the next one?
                </p>
                <button onClick={continueAfterCheck}
                  className="text-sm font-medium px-5 py-2.5 rounded border border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20">
                  Continue →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
