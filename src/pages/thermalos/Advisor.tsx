import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Copy, Check, ExternalLink, ChevronDown } from "lucide-react";
import {
  fetchAdvisorQuestions, generateDemoAdvisorQuestions, isDemoModeError,
  fetchDecisionLog, generateDemoDecisionLog,
  fetchAdvisorAsks, generateDemoAdvisorAsks,
  type AdvisorQuestion, type DecisionLogRow, type AdvisorAsk,
} from "@/services/thermalosApi";

// TODO: replace with the actual Microsoft Bookings URL once created
const BOOKINGS_URL = "https://outlook.office365.com/bookings/";

// ─── Style maps ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AdvisorQuestion["status"], { label: string; fg: string; bg: string; border: string }> = {
  open:          { label: "Open",          fg: "#60a5fa", bg: "#3b82f615", border: "#3b82f640" },
  in_discussion: { label: "In discussion", fg: "#EF9F27", bg: "#EF9F2715", border: "#EF9F2740" },
  answered:      { label: "Answered",      fg: "#35C792", bg: "#0F6E5615", border: "#1D9E7540" },
};

const PRIORITY_COLOR: Record<AdvisorQuestion["priority"], string> = {
  high:   "#f87171",
  normal: "#888780",
  low:    "#5a5a55",
};

// ─── Primitives ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: AdvisorQuestion["status"] }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap"
      style={{ color: s.fg, background: s.bg, border: `0.5px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  q,
  selectable,
  selected,
  onToggle,
}: {
  q: AdvisorQuestion;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  return (
    <div
      className="bg-[#141412] border border-white/[0.07] rounded-md p-4"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <button
            onClick={() => onToggle?.(q.id)}
            className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors"
            style={{
              borderColor: selected ? "#1D9E75" : "rgba(255,255,255,0.2)",
              background: selected ? "#1D9E75" : "transparent",
            }}
          >
            {selected && <Check size={10} className="text-white" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusPill status={q.status} />
            {q.priority === "high" && (
              <span className="text-[10px] font-mono" style={{ color: PRIORITY_COLOR.high }}>
                High priority
              </span>
            )}
            <span className="text-[10px] font-mono text-[#5a5a55]">{q.date_raised}</span>
          </div>

          <p className="text-[13px] text-[#E6F7F1] leading-snug mb-3">{q.question}</p>

          {q.what_i_tried && (
            <div className="mb-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#5a5a55] mb-1">
                What I tried
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                {q.what_i_tried}
              </p>
            </div>
          )}

          {q.status === "answered" && q.answer && (
            <div className="mt-3 pl-3 border-l-2 border-[#1D9E75]">
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#1D9E75] mb-1">
                Kundu -- {q.answered_date}
              </div>
              <p className="text-[12px] text-[#9FE1CB] leading-relaxed">{q.answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Meeting booking panel ────────────────────────────────────────────────────

function MeetingPanel({
  questions,
  onClose,
}: {
  questions: AdvisorQuestion[];
  onClose: () => void;
}) {
  const active = questions.filter((q) => q.status !== "answered");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(active.map((q) => q.id))
  );
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedList = active.filter((q) => selected.has(q.id));
  const copyText = selectedList.map((q, i) => `${i + 1}. ${q.question}`).join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-[#141412] border border-white/[0.07] rounded-md p-5"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#E6F7F1]">
          Select questions to discuss
        </h3>
        <button
          onClick={onClose}
          className="text-[11px] font-mono text-[#5a5a55] hover:text-[#888780] transition-colors"
        >
          cancel
        </button>
      </div>

      {active.length === 0 ? (
        <p className="text-[12px] text-[#5a5a55] font-mono mb-4">No open questions.</p>
      ) : (
        <div className="space-y-2 mb-5">
          {active.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              selectable
              selected={selected.has(q.id)}
              onToggle={toggle}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.05]">
        <button
          onClick={handleCopy}
          disabled={selectedList.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono border border-white/[0.1] text-[#a8a89f] hover:text-[#E6F7F1] hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? <Check size={11} className="text-[#35C792]" /> : <Copy size={11} />}
          {copied
            ? "Copied"
            : `Copy ${selectedList.length} question${selectedList.length !== 1 ? "s" : ""}`}
        </button>

        <a
          href={BOOKINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono bg-[#1D9E75] text-white hover:bg-[#22b589] transition-colors"
        >
          <Calendar size={11} />
          Book time
          <ExternalLink size={10} />
        </a>

        <span className="text-[9px] font-mono text-[#5a5a55]">
          Copy, then paste into the Bookings notes field.
        </span>
      </div>
    </div>
  );
}

// ─── Decision log ─────────────────────────────────────────────────────────────

function DecisionLog({
  decisions,
  questions,
}: {
  decisions: DecisionLogRow[];
  questions: AdvisorQuestion[];
}) {
  return (
    <section className="mb-8">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
        Decision log
      </div>
      <div
        className="bg-[#141412] border border-white/[0.07] rounded-md overflow-hidden"
        style={{ borderWidth: "0.5px" }}
      >
        {decisions.length === 0 ? (
          <p className="p-4 text-[12px] text-[#5a5a55] font-mono">
            No decisions recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {decisions.map((d, i) => {
              const source = questions.find((q) => q.id === d.source_question_id);
              const superseded = d.status === "superseded";
              return (
                <li key={i} className={`px-4 py-3 ${superseded ? "opacity-40" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-[#5a5a55]">{d.date}</span>
                    {superseded && (
                      <span className="text-[9px] font-mono text-[#5a5a55] border border-white/[0.1] rounded px-1.5 py-0.5">
                        superseded
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[13px] font-semibold mb-1 leading-snug ${
                      superseded ? "line-through text-[#888780]" : "text-[#E6F7F1]"
                    }`}
                  >
                    {d.decision}
                  </p>
                  {d.rationale && (
                    <p className="text-[11px] text-[#6b7280] leading-relaxed">{d.rationale}</p>
                  )}
                  {source && (
                    <p className="text-[10px] font-mono text-[#5a5a55] mt-1.5">
                      from: {source.question.length > 70
                        ? source.question.slice(0, 70) + "..."
                        : source.question}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Advisor asks ─────────────────────────────────────────────────────────────

function AdvisorAsksSection({ asks }: { asks: AdvisorAsk[] }) {
  return (
    <section className="mb-8">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
        What I need from you
      </div>
      <div
        className="bg-[#141412] border border-white/[0.07] rounded-md"
        style={{ borderWidth: "0.5px" }}
      >
        {asks.length === 0 ? (
          <p className="p-4 text-[12px] text-[#5a5a55] font-mono">
            No outstanding asks.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {asks.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <p
                  className={`text-[13px] leading-snug ${
                    a.status === "resolved"
                      ? "line-through text-[#5a5a55]"
                      : "text-[#E6F7F1]"
                  }`}
                >
                  {a.ask}
                </p>
                <span
                  className="text-[10px] font-mono flex-shrink-0 mt-0.5"
                  style={{ color: a.status === "resolved" ? "#35C792" : "#EF9F27" }}
                >
                  {a.status === "resolved" ? "Resolved" : "Open"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Advisor() {
  useEffect(() => {
    document.title = "ThermalOS -- Advisor | amogh.site";
  }, []);

  const [showBooking, setShowBooking] = useState(false);
  const [answeredExpanded, setAnsweredExpanded] = useState(false);

  const { data: qData, error: qErr, isError: qIsErr, isLoading } = useQuery({
    queryKey: ["advisor-questions"],
    queryFn: fetchAdvisorQuestions,
    staleTime: 60_000,
    retry: false,
  });
  const { data: dData, error: dErr, isError: dIsErr } = useQuery({
    queryKey: ["decision-log"],
    queryFn: fetchDecisionLog,
    staleTime: 60_000,
    retry: false,
  });
  const { data: aData, error: aErr, isError: aIsErr } = useQuery({
    queryKey: ["advisor-asks"],
    queryFn: fetchAdvisorAsks,
    staleTime: 60_000,
    retry: false,
  });

  const demo =
    (qIsErr && isDemoModeError(qErr)) ||
    (dIsErr && isDemoModeError(dErr)) ||
    (aIsErr && isDemoModeError(aErr));

  const questions = !qData || qData.length === 0 ? generateDemoAdvisorQuestions() : qData;
  const decisions = !dData || dData.length === 0 ? generateDemoDecisionLog() : dData;
  const asks      = !aData || aData.length === 0 ? generateDemoAdvisorAsks()   : aData;

  const open        = questions.filter((q) => q.status === "open");
  const inDiscussion = questions.filter((q) => q.status === "in_discussion");
  const answered    = questions.filter((q) => q.status === "answered");

  if (isLoading) {
    return (
      <div className="h-96 bg-[#141412] border border-white/[0.07] rounded-md animate-pulse" />
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-1">
          ThermalOS -- Advisor
        </div>
        <h1 className="text-[22px] md:text-[26px] font-semibold text-[#E6F7F1] tracking-tight">
          Advisor collaboration
        </h1>
        <p className="text-[12px] text-[#888780] mt-1 max-w-2xl">
          Open questions, prior effort, decisions, and what I need from you. Updated before each meeting.
        </p>
      </div>

      {demo && (
        <div className="mb-6 px-3 py-2 rounded bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[12px] font-mono text-[#EF9F27]">
          Demo mode -- add AdvisorQuestions, DecisionLog, and AdvisorAsks tabs to the Google Sheet for live data.
        </div>
      )}

      {/* Section A: Open Questions */}
      <section className="mb-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
          Open questions ({open.length + inDiscussion.length} active)
        </div>

        <div className="space-y-3">
          {open.length === 0 && inDiscussion.length === 0 && (
            <p className="text-[12px] text-[#5a5a55] font-mono">No open questions.</p>
          )}
          {open.map((q) => <QuestionCard key={q.id} q={q} />)}

          {inDiscussion.length > 0 && (
            <>
              {open.length > 0 && (
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] pt-2">
                  In discussion
                </div>
              )}
              {inDiscussion.map((q) => <QuestionCard key={q.id} q={q} />)}
            </>
          )}
        </div>

        {answered.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setAnsweredExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-[#5a5a55] hover:text-[#888780] transition-colors"
            >
              <ChevronDown
                size={10}
                className={`transition-transform ${answeredExpanded ? "rotate-180" : ""}`}
              />
              {answeredExpanded ? "Hide" : "Show"} {answered.length} answered
              {answered.length !== 1 ? " questions" : " question"}
            </button>
            {answeredExpanded && (
              <div className="mt-3 space-y-3 opacity-70">
                {answered.map((q) => <QuestionCard key={q.id} q={q} />)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section B: Request a Meeting */}
      <section className="mb-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5a5a55] mb-3">
          Request a meeting
        </div>
        {showBooking ? (
          <MeetingPanel questions={questions} onClose={() => setShowBooking(false)} />
        ) : (
          <button
            onClick={() => setShowBooking(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded border border-[#1D9E75]/40 bg-[#0F6E56]/10 text-[13px] font-mono text-[#35C792] hover:bg-[#0F6E56]/20 transition-colors"
          >
            <Calendar size={14} />
            Request a meeting with Kundu
          </button>
        )}
      </section>

      {/* Section C: Decision Log */}
      <DecisionLog decisions={decisions} questions={questions} />

      {/* Section D: What I Need From You */}
      <AdvisorAsksSection asks={asks} />
    </div>
  );
}
