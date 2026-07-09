// Progressive unlocking for the EPIC student flow.
//
// Rules:
// - The on-ramp (setup / intro / blink) is always open and needs no check-off.
// - Day 1-4 activities unlock in order: an activity opens only once every
//   REQUIRED (non-optional) activity before it has been checked off. Optional
//   activities (e.g. RGB, sound) never block the next one.
// - Finishing a full day's required activities opens the Additional Exercises
//   for 22 hours, then they close again until the next day's tasks are done.
//
// Completion is recorded when an instructor approves a check-off, and stored
// per cohort+group as { [activityId]: completedAtMs }.
import { CURRICULUM, type Activity } from "./curriculum";

export const ADDITIONAL_WINDOW_MS = 22 * 60 * 60 * 1000; // 22 hours

// Progressive unlocking stays DORMANT until this moment - every activity is
// open before it, so it can't lock students out mid-session. It flips on
// automatically at the timestamp (no deploy needed).
// 2026-07-02 15:35 PDT.
export const UNLOCK_ACTIVE_FROM = 1783031700000;
export const gatingActive = (now: number) => now >= UNLOCK_ACTIVE_FROM;

export const ONRAMP = new Set(["setup", "intro", "blink"]);

export type Completed = Record<string, number>;

// gated (check-off-able) day 1-4 activities, in curriculum order
const GATED = CURRICULUM.filter((a) => a.day <= 4 && !ONRAMP.has(a.id));
const REQ_BEFORE: Record<string, string[]> = {};
GATED.forEach((a, i) => {
  REQ_BEFORE[a.id] = GATED.slice(0, i).filter((x) => !x.optional).map((x) => x.id);
});

export function isUnlocked(activity: Activity, completed: Completed, now: number): boolean {
  if (!gatingActive(now)) return true; // dormant until go-live: everything open
  if (ONRAMP.has(activity.id)) return true;
  if (activity.day === 5) return additionalsOpen(completed, now);
  const req = REQ_BEFORE[activity.id];
  if (!req) return true; // not a gated activity (shouldn't happen for day<=4)
  return req.every((id) => id in completed);
}

// When did the group finish day D's required activities? null if not finished.
export function dayCompletionTime(day: number, completed: Completed): number | null {
  const req = GATED.filter((a) => a.day === day && !a.optional);
  if (req.length === 0) return null;
  if (!req.every((a) => a.id in completed)) return null;
  return Math.max(...req.map((a) => completed[a.id]));
}

// The moment the current Additional-Exercises window closes (or null if never opened).
export function additionalsUntil(completed: Completed): number | null {
  let best: number | null = null;
  for (let d = 1; d <= 4; d++) {
    const t = dayCompletionTime(d, completed);
    if (t == null) continue;
    const until = t + ADDITIONAL_WINDOW_MS;
    if (best == null || until > best) best = until;
  }
  return best;
}

export function additionalsOpen(completed: Completed, now: number): boolean {
  const until = additionalsUntil(completed);
  return until != null && now < until;
}

// Whether any day 1-4 required set has EVER been finished (window may be closed).
export function hasFinishedADay(completed: Completed): boolean {
  for (let d = 1; d <= 4; d++) if (dayCompletionTime(d, completed) != null) return true;
  return false;
}
