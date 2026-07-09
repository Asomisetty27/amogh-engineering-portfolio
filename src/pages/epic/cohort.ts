// EPIC 2026 - runtime cohort (weekly reset).
// Replaces the old hardcoded COHORT const. The active cohort scopes every
// query, insert, and realtime filter in StudentHelper + InstructorDashboard.

export const COHORTS = ["week1", "week2", "week3", "week4"] as const;
export type Cohort = (typeof COHORTS)[number];

export const DEFAULT_COHORT: Cohort = "week1";
const LS_COHORT = "epic_cohort";

export const COHORT_LABEL: Record<Cohort, string> = {
  week1: "Week 1",
  week2: "Week 2",
  week3: "Week 3",
  week4: "Week 4",
};

export function isCohort(v: string | null | undefined): v is Cohort {
  return !!v && (COHORTS as readonly string[]).includes(v);
}

// Resolve the active cohort. A `?cohort=week2` URL param wins and is written
// back to localStorage, so handing a student a per-week link like
// `epic.amogh.site/?cohort=week2` both scopes this session AND sticks on reload.
export function readCohort(): Cohort {
  if (typeof window === "undefined") return DEFAULT_COHORT;
  const fromUrl = new URLSearchParams(window.location.search).get("cohort");
  if (isCohort(fromUrl)) {
    localStorage.setItem(LS_COHORT, fromUrl);
    return fromUrl;
  }
  const saved = localStorage.getItem(LS_COHORT);
  return isCohort(saved) ? saved : DEFAULT_COHORT;
}

export function writeCohort(c: Cohort): void {
  if (typeof window !== "undefined") localStorage.setItem(LS_COHORT, c);
}
