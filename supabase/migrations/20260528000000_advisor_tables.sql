-- Advisor collaboration tables
-- Run this in Supabase dashboard > SQL editor

create table advisor_questions (
  id            uuid primary key default gen_random_uuid(),
  date_raised   timestamptz not null default now(),
  question      text not null,
  what_i_tried  text,
  status        text not null default 'open'
                  check (status in ('open','in_discussion','answered')),
  priority      text not null default 'normal'
                  check (priority in ('high','normal','low')),
  answer        text,
  answered_by   text,
  answered_at   timestamptz
);

create table decision_log (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  decision            text not null,
  rationale           text,
  source_question_id  uuid references advisor_questions(id) on delete set null,
  status              text not null default 'active'
                        check (status in ('active','superseded'))
);

create table advisor_asks (
  id      uuid primary key default gen_random_uuid(),
  ask     text not null,
  status  text not null default 'open'
            check (status in ('open','resolved'))
);

-- Single-row allowlist -- add more rows for additional advisors later
create table advisor_allowlist (
  email text primary key
);

-- ─── Seed allowlist ──────────────────────────────────────────────────────────

insert into advisor_allowlist (email) values ('sokundu@calpoly.edu');

-- ─── Seed advisor_questions ───────────────────────────────────────────────────

insert into advisor_questions (id, date_raised, question, what_i_tried, status, priority) values
  ('a0000001-0000-0000-0000-000000000001',
   '2026-05-20T00:00:00Z',
   'How do we handle T_reference uncertainty at low power loads? At 9.5W idle, a 5C ambient error causes a 35% R_theta swing.',
   'Ran F002 sensitivity analysis assuming T_ref = 25C from literature. Found 35.3% swing at idle vs 10.2% at load. The metric is most sensitive exactly when power is lowest -- and that is when anomaly detection matters most.',
   'open', 'high'),

  ('a0000001-0000-0000-0000-000000000002',
   '2026-05-20T00:00:00Z',
   'Rolling average vs median filter vs steady-state window for R_theta computation -- which method is most valid?',
   'Implemented 5s rolling average and 5s median filter, compared against raw power. R_theta std improved by 3.5% max (rolling avg), negligible with median. Variance source is T_reference uncertainty, not power noise (F003 null result).',
   'answered', 'normal'),

  ('a0000001-0000-0000-0000-000000000003',
   '2026-05-20T00:00:00Z',
   'Is the rule-based state classifier statistically valid, or should it be probabilistic? Current thresholds misclassify 47-98% of transitional phases.',
   'Implemented thresholds: util < 5%, power < 15W, temp < 55C. Works on stable endpoints but fails transitional phases (F004). Reviewed Orange Data Mining -- Naive Bayes and Random Forest both viable. Goal is a model equation, not a black box.',
   'in_discussion', 'high'),

  ('a0000001-0000-0000-0000-000000000004',
   '2026-05-22T00:00:00Z',
   'Is the ~447MB NVML memory reported with no active processes a state variable or a driver artifact?',
   'Observed consistently across E001-E004 in both nvidia-smi and pyNVML. Appears at driver load, persists through process exit. No named processes attached. Not documented in NVIDIA driver release notes.',
   'open', 'normal'),

  ('a0000001-0000-0000-0000-000000000005',
   '2026-05-20T00:00:00Z',
   't-test vs Mann-Whitney U for small-sample recovery comparison -- given n=3 trials, which is appropriate?',
   'n=3 cross-trial CV is low (1.68% load, 0.64% recovery). t-test requires normality at n=3 which is hard to justify. Mann-Whitney U is non-parametric but loses power at small n. Standard recommendation is n >= 10 before reporting p-values.',
   'open', 'normal');

-- Answer Q2 (smoothing null result -- answered at first Kundu meeting)
update advisor_questions
set answer      = 'Use steady-state window. The null result confirms filtering does not address the root cause. Do not add complexity that does not reduce the dominant error source.',
    answered_by = 'sokundu@calpoly.edu',
    answered_at = '2026-05-27T00:00:00Z'
where id = 'a0000001-0000-0000-0000-000000000002';

-- ─── Seed decision_log ────────────────────────────────────────────────────────

insert into decision_log (created_at, decision, rationale, source_question_id, status) values
  ('2026-05-27T00:00:00Z',
   'Use steady-state window for R_theta computation',
   'Rolling avg and median filter both showed negligible improvement (3.5% max). Dominant error source is T_reference uncertainty, not power noise. Simpler is better.',
   'a0000001-0000-0000-0000-000000000002', 'active'),

  ('2026-05-27T00:00:00Z',
   'Pursue Bayesian classification over hardcoded thresholds',
   'Rule-based classifier fails 47-98% of transitional phases. Bayesian approach via Orange Data Mining allows probabilistic state assignment and produces a model equation rather than a black box.',
   'a0000001-0000-0000-0000-000000000003', 'active'),

  ('2026-05-27T00:00:00Z',
   'Redo E003 and E004 with 10+ trials on Stage 2 hardware',
   'n=3 is insufficient for statistical testing. Need n >= 10 before reporting confidence intervals. Repeat on dedicated hardware where ambient is controlled.',
   'a0000001-0000-0000-0000-000000000005', 'active'),

  ('2026-05-27T00:00:00Z',
   'Hold formal t-tests and p-values until sample is larger',
   'n=3 descriptive stats are promising but formal tests are unreliable at this sample size. Report CV and descriptive stats only until Stage 2 replications are complete.',
   'a0000001-0000-0000-0000-000000000005', 'active'),

  ('2026-05-27T00:00:00Z',
   'Target a conference publication as the end goal',
   'Kundu confirmed this is the appropriate end goal. The research should culminate in a publication. YC application uses the results, but the research is the primary output. Venue TBD.',
   null, 'active');

-- ─── Seed advisor_asks ────────────────────────────────────────────────────────

insert into advisor_asks (ask, status) values
  ('Confirm conference target venue and submission deadline', 'open'),
  ('Confirm whether informal summer advising suffices to support an AI Factory cluster access request to the Noyce School', 'open');

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table advisor_questions  enable row level security;
alter table decision_log       enable row level security;
alter table advisor_asks       enable row level security;
alter table advisor_allowlist  enable row level security;

-- Everyone can read
create policy "public_read"  on advisor_questions  for select using (true);
create policy "public_read"  on decision_log       for select using (true);
create policy "public_read"  on advisor_asks       for select using (true);
create policy "public_read"  on advisor_allowlist  for select using (true);

-- Only allowlisted advisors can update questions (answer fields)
create policy "advisor_update" on advisor_questions for update
  using     (auth.email() in (select email from advisor_allowlist))
  with check (auth.email() in (select email from advisor_allowlist));
