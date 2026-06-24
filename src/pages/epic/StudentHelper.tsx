import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRICULUM, DAY_TITLES, WIRE, GROUP_COUNT, THANKYOU_EMAIL, type Activity, type HelpType } from "./curriculum";
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
  const [setupCopied, setSetupCopied] = useState(false);
  const [troubleOpen, setTroubleOpen] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [notified, setNotified] = useState<HelpType | null>(null);
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
    setExtOpen(false);
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

              {/* Extension challenge for fast finishers (Part 4) */}
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
