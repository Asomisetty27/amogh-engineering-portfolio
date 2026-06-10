# THETA — GPU Thermal Forensics Platform
## Redbrick VC Investment Deck | June 2026

---

## The Problem

**GPU operators are flying blind on thermal degradation.**

- Temperature alone is ambiguous: a hot GPU could mean heavy workload OR cooling failure
- Existing tools (NVIDIA Mission Control, Phaidra, ProphetStor) track temperature + power, but don't separate workload from failure
- No operator knows when cooling is degrading until **throttling happens** — too late
- Degraded cooling + high-load work = **failure in production** = downtime, RMA costs, customer impact

**The real cost:** A single throttle event on a GPU cluster = lost SLA, lost revenue, operational firefighting.

---

## The Insight

**Effective thermal resistance captures cooling health independently of workload.**

```
R_theta = (T_junction - T_ambient) / P_GPU
```

- **In healthy hardware:** R_theta is stable (~0.72 C/W under load, ~1.28 C/W at idle)
- **When cooling degrades:** R_theta rises, even at constant power
- **The signal:** Rising R_theta before throttling = **predictive maintenance window**

This single metric, computed in real time from NVML telemetry, is the product.

---

## Stage 1: Validation Complete ✓

**4 controlled experiments on Tesla T4 (Colab), Stage 1 complete 2026-06-05.**

**Finding 1: Thermal memory signature (n=7 trials, controlled variables)**
- 2°C ambient temperature change → 3.5× power recovery time difference
- Thermal state has at least two independent dimensions (starting temperature + wait duration)
- Publication-grade reproducibility (CV 1.8% within-group)

**Finding 2: CUDA context effect (invisible to utilization monitoring)**
- Child-process exit (context released): GPU recovers to idle in 140–210s ✓
- Same-process exit (context retained): GPU stays at P0, never drops below 15W ✗
- This failure mode is undetectable from power or temperature alone

**Finding 3: R_theta separates workload from cooling**
- Same workload on two hardware conditions (cool vs warm ambient): 35% R_theta variance
- Variance is driven by starting temperature, not by load changes

**Data volume:** 8,734 rows (E001–E004 v1 + E004 v2 across 7 trials). All raw data in repo.

---

## Stage 2: Next 90 Days (Summer 2026)

### AI Factory Deployment (Cal Poly, DGX B200)
- **What:** Canary install on 1 of 4 new DGX B200 nodes
- **Hardware:** $200K GPU cluster, native BMC-measured ambient (not simulated)
- **Experiments:** E005 (power-cap sweep), validation of cross-vendor calibration
- **Gating:** Lupo meeting (target June 12) to greenlight deployment
- **Timeline:** Canary live by July 15

### OSS Agent v0 Launch
- **Ship:** `pip install runtheta` → 60s to first output
- **Features:** R_theta computation, drift detection, fault classification, Prometheus metrics, webhook alerts
- **Status:** v0.1.9 live on PyPI as of 2026-06-05
- **Discovery:** 10 neocloud operator calls (RunPod, Vast.ai, Lambda) to validate product-market fit

### Lead-Time Validation (E-LT Simulation)
- **Question:** Does R_theta rise *before* throttling (predictive) or only after (diagnostic)?
- **Evidence:** 5-state physics simulation (convection, radiation, Arrhenius TIM kinetics) validated 16/16
- **Prediction:** ~1.2h lead time for TIM degradation, ~28min for airflow blockage, ~2min for fan failure
- **Hardware test:** Fall 2026 on live B200 cluster

---

## What $500 Buys

### Compute & Infrastructure (Primary)
- **Claude API quota** ($200/month): 5M tokens/month for codebase optimization, test suite expansion, vector search for codebase navigation
- **Colab Pro+ for compute** ($100/month): Sustained GPU access for continuous E005 experiments, thermal characterization runs
- **AWS/GCP credits** ($100): Serverless endpoints for live R_theta dashboard, telemetry ingestion pipeline
- **Domain + CDN** ($50): `theta.ai` registration + Vercel deployment for marketing site and API

### Why This Accelerates Stage 2
- **Faster iteration:** API quota removes batch-job bottlenecks for data processing
- **Continuous telemetry:** Colab Pro allows overnight experiment runs (lead-time validation)
- **Live product:** Hosted dashboard makes "working agent" credible for YC W27 application
- **Credibility:** Real domain + deployed site closes the "this is a hobby project" optic

---

## Product Roadmap

| Stage | Timeline | Milestone | Evidence |
|---|---|---|---|
| **1: Validation** | Jan–Jun 2026 ✓ | R_theta metric works | 8,734 rows, n=7 controlled trials |
| **2: Deployment** | Jun–Sep 2026 | Live on real hardware (B200) | DGX canary install + Lupo partnership |
| **3: Adoption** | Sep–Dec 2026 | Neocloud operators running agent | First 3–5 discovery call conversions |
| **4: Series A** | 2027 | $1–2M seed round | YC W27 + Redbrick + new LPs |

---

## Why Redbrick, Why Now

### Strategic Fit
- **AI infrastructure thesis:** GPU observability is table stakes; Redbrick's portfolio companies need this
- **Network value:** Introduce Theta to CoreWeave, Crusoe, other portfolio companies → validation + customers
- **Technical credibility:** Jessica (Redbrick) brings operator context; Kundu (advisor) brings academic rigor

### Timing
- **Window closing:** NVIDIA Mission Control + Phaidra are moving upmarket; OSS plays have 12–18 months before feature parity
- **Cal Poly partnership:** DGX B200 cluster (4 nodes) is *live now*; deployment happens this summer, not 2027
- **YC W27:** Application deadline Q3 2026; need "working agent + operator feedback" proof by September

### What Success Looks Like (by Dec 2026)
- ✓ E-LT validates lead-time prediction (R_theta rises 1+ hour before throttling)
- ✓ First neocloud (RunPod or Vast.ai) running Theta agent in production
- ✓ Agent telemetry shows thermal degradation detection rate > 95% (validation on real hardware vs Colab)
- ✓ 500+ operators have installed `pip install runtheta` (PyPI stats)

---

## The Team

| Role | Name | Background |
|---|---|---|
| **Founder** | Amogh Somisetty | Cal Poly EE '26, AI-native builder, Claude Code expert |
| **Co-Founder** | Sam | Cal Poly ME, lead-time testbed design, hardware expertise |
| **Advisor** | Prof. Souvik Kundu | Cal Poly EE, ex-Intel, thermal design researcher |
| **Advisor (Pending)** | Prof. Yu | Signal processing, Colab validation |
| **Partner** | Prof. Christopher Lupo | Cal Poly CS/SE, Sandia resilience testbed PI, AI Factory director |

---

## Traction

- **PyPI:** v0.1.9 published, `pip install runtheta` live
- **Code:** Full source on GitHub (Asomisetty27/theta)
- **Data:** 8,734 rows of Stage 1 experiments, publicly linked
- **Partnerships:** Lupo signed on as partner for AI Factory canary; Kundu advising formally
- **Outreach:** Discovery calls sent to 3 neoclouds (June 2); awaiting operator feedback
- **Academic:** Paper in prep for ICPE 2027, simulation validated 16/16

---

## The Ask

**$500 (Redbrick Grant)**
- Tranche 1: $250 on signature (June 2026) → compute credits + API
- Tranche 2: $250 on Stage 2 milestone (Lupo canary install live, July 15)

**Why This Matters**
- NOT a full Series A yet; this is **proof-of-concept capital** to unlock Stage 2
- De-risks the YC W27 application (live hardware validation + operator feedback)
- Builds the relationship: Redbrick as Theta's first institutional investor

---

## Questions? Next Steps

**For Redbrick:**
1. Intro call with Ryan + team (this week) → feedback on deck
2. Technical deep-dive with Kundu on R_theta metric + E004 data (June 14)
3. Site visit to Cal Poly AI Factory when Lupo deploy goes live (July 15)
4. YC office hours together (September)

**By September 2026:**
- Agent is live on real B200 hardware
- First neocloud operator feedback collected
- YC W27 application submitted with Redbrick as lead investor

---

**Theta: Predictive maintenance for GPU clusters, starting with the engineers who build them.**

`runtheta.com` | `amogh.site/thermalos` | `pip install runtheta`
