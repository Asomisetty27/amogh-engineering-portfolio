# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> The committed `README.md` is the default **Lovable** boilerplate ("Welcome to your Lovable project", `REPLACE_WITH_PROJECT_ID`) - ignore it for orientation; it documents nothing about this codebase. This file is the real guide.

## What this is

A Vite + React + TypeScript + Tailwind + shadcn/Radix site that serves **three** distinct purposes from one codebase:

1. **Amogh's engineering portfolio** (the public front).
2. **The ThermalOS display surface** (recent history: "thermalos site: v0.1.10 + accuracy pass") - overlaps in role with the separate `theta-landing` repo.
3. **The EPIC lab tool** - the Arduino/LA-job lab helper: per-cohort shareable student links, path-based handout, week badges (history: "EPIC: shareable per-cohort student link", "path-based handout").

Backend is **Supabase** (`supabase/` migrations, `migrate-advisor-tables.sql`, an `integrations/` layer in `src/`). There's also a **Google Apps Script** file at root, `Code.gs` - server-side glue (likely the EPIC/advisor sheet integration) that is *not* part of the Vite build and deploys separately into Apps Script.

## Commands

```bash
npm run dev          # vite dev (bun also works - bun.lock present)
npm run build        # → dist/
npm run lint         # eslint
npm run test         # vitest (run once); test:watch to watch
npx playwright test  # e2e (playwright.config.ts, playwright-fixture.ts)
```

`test-supabase*.js` at root are ad-hoc connection probes, not part of the suite.

## Architecture notes

- Standard shadcn/Vite layout under `src/`: `pages/`, `components/`, `contexts/`, `hooks/`, `services/`, `integrations/` (Supabase client), `data/`, `lib/`.
- **One codebase, multiple products** - before editing, identify which surface (portfolio vs. ThermalOS vs. EPIC) a file belongs to; they share UI primitives but have separate routes/data. A change to shared `components/ui` affects all three.
- **`Code.gs` lives outside the build.** Editing it here does not deploy it - it must be pushed into the Google Apps Script project. Keep the repo copy in sync with what's deployed, but know they're decoupled.
- **Supabase is the data layer** - schema changes go through `supabase/` migrations + the advisor-tables SQL, not ad-hoc client writes.

## Deploy / hosting constraint

Hosted via **Lovable** (auto-commits from the Lovable editor land in this repo). Per project history there is a **single-primary-domain constraint** on the Lovable plan - the three surfaces share one deployment, which is why path-based routing (e.g. the EPIC per-cohort handout links) is used instead of subdomains. Account for that when adding new entry points.
