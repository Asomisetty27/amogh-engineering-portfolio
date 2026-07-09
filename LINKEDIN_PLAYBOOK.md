# LinkedIn Playbook - Amogh Somisetty

**Goal:** Land a *very prestigious* EE internship (Summer 2027). Any elite EE domain - semiconductor, chip design, aerospace/defense, big-tech hardware, RF/comms, power, research labs. GPU/ML is a stated interest, not a constraint.

**Stage:** Rising junior, B.S. Electrical Engineering, Cal Poly SLO, Class of 2028.

> Status note (updated 2026-06-27): reflects real experience from the live profile (Natera internship + promotion, CVS, PEC presidency). Research basis = multi-source web search + two `/deep-research` adversarial-verification runs (the engine hit the session limit before its own synthesis step both times; findings below are synthesized manually from the 7 claims that passed 3-0 verification across both runs, plus the claims that were genuinely refuted 0-3).

---

## Verified research findings (adversarial /deep-research, 2026-06-27)

**[VERIFIED 3-0] = survived 3-vote adversarial refutation. [REFUTED 0-3] = disproven, do NOT do.**

**Search mechanics (do not chase ranking hacks):**
- [VERIFIED] LinkedIn Recruiter has **no fixed ranking**; results are personalized per searcher (their network, history, similar-searcher behavior). *LinkedIn Help a524188.* You cannot game position; optimize for findable + complete + active.
- [VERIFIED] **Keyword-stuffing triggers spam down-ranking.** *Same source.* Place terms naturally, never in walls.
- [VERIFIED] LinkedIn's official Boolean docs **do not disclose field weights**. *Help a524335.* So ignore blog claims like "headline = 60% of ranking weight" or "Current Title is the most-weighted field" - those are unsubstantiated and they contradict each other.
- [REFUTED 0-3] "Boolean only matches specific sections (About/Experience/Skills)." The corrected, well-supported picture: the keyword search scans the **whole profile**, so real keywords anywhere (headline, About, Experience prose, Skills, Education) are findable. Keyword **presence** matters for discoverability; keyword **position tricks** do not.
- [REFUTED 0-3] "Keep your most recent internship title in your headline for months." Do not anchor the headline to a past title; lead with domain + the flagship.

**What elite recruiters actually reward:**
- [VERIFIED] NVIDIA recruiter (Linh Nguyen): screens for **practical application of skills** through projects/extracurriculars/coursework, not just a skills list. *blogs.nvidia.com.* Your projects ARE this; make them prominent.
- [VERIFIED] Top NVIDIA candidates differentiate by **deeper understanding of the company's mission** or **firsthand experience using NVIDIA's technology**. *Same source.* This is your unfair advantage: Theta runs on NVML/DCGM, validated on H100s, deploying on DGX B200. That is literal firsthand experience with NVIDIA's stack. Say so plainly in About and in the Theta entry.
- [VERIFIED] **Quantify achievements, not duties** ("Generated 50+ leads..." not "Sent emails..."). *ripplematch.* Applies directly to your Natera bullets and every project line.

---

## The strategy in one line
Position as **an EE who does research-grade reliability engineering and *ships* it** - not "a student who codes." That framing reads as top-1% to *every* elite EE program (semiconductor, aerospace, big-tech HW, national labs all prize rigor + real-hardware validation + the ability to finish). Your flagship (Theta) is the prestige differentiator; your fundamentals (analog/PCB, FPGA/RISC-V, electromechanical) prove you're a real EE, not boxed into software.

## What elite-EE recruiters actually screen for (research-backed)
1. **Proof you ship, public** - GitHub/OSS/deployed work beats GPA-and-coursework. You have PyPI + Docker + CI + a live web product.
2. **Tool-chain specificity** - generic "improved performance" gets ignored; exact tools get searched (Verilog, FPGA, Python, C/C++, MATLAB, PCB). Name them.
3. **System-level + quantified** - metrics, not adjectives ("±1 LSB across 16 codes," "blind-validated on 72 H100s").
4. **Research / publication signal** - a paper trajectory is rare for an undergrad and differentiates hard.
5. **Prestige pedigree + keywords in Headline/About** - recruiters use Boolean search; matches highlight in headline, About, Experience, Skills. Keywords absent = invisible.
6. **Hygiene multipliers** - professional photo (≈14× views), 3+ recommendations, custom URL, weekly activity.

---

## 1. Headline (most-searched field - front-load keywords; first ~80 chars are the mobile/preview cut)

**Primary (flagship-led, prestige hook):**
```
Electrical Engineering @ Cal Poly SLO | Creator of Theta: GPU thermal/power reliability agent (NVML/DCGM, validated on 72 production H100s) | RTL/FPGA + analog/PCB | Seeking Summer 2027 EE internship
```

**Alt (breadth/keyword-led, widest recruiter coverage):**
```
Electrical Engineering @ Cal Poly SLO | Hardware, FPGA & Embedded Systems | RISC-V · PCB/Analog Design · Python/C++ · ML | Open-source author | Seeking Summer 2027 Internships
```

## 2. About (~2,000 chars; first 2 lines show before "see more")
```
I build hardware-adjacent systems and prove they work on real silicon.

My main project, Theta, is an open-source GPU thermal and power reliability
agent. It computes per-GPU thermal resistance (R_θ = ΔT/P) from live NVML/DCGM
telemetry and flags failing GPUs with a peer-relative anomaly detector. I
blind-validated it on 72 production Princeton H100s with 0 false positives,
shipped it on PyPI (pip install runtheta) with Docker and CI, and I'm deploying
it to a Cal Poly DGX B200 cluster. A paper is targeted at ICPE 2027. It is
firsthand work on the NVIDIA data-center stack, end to end.

I like problems that span the stack. I hand-fabricated a 4-bit binary-weighted
DAC on a 2-layer PCB and validated it to within ±1 LSB across all 16 codes. I
built a multi-cycle RISC-V (RV32I) CPU in SystemVerilog on a Basys-3 FPGA. I
designed a 9-stage electromechanical system spanning capacitive sensing, an HV
strobe, optical detection, and frequency-domain metal detection.

At Natera I was hired as an Operations & Systems Engineering Intern and promoted
mid-internship by the VP of Lab Operations to Optimization Engineering Intern
for automation and cross-team tooling.

Tools: Python, C/C++, SystemVerilog/RTL, FPGA/Vivado, PCB and analog design,
NVML/DCGM, scikit-learn, Docker, Linux, MATLAB.

I'm looking for a Summer 2027 EE internship in chip design, hardware, RF/comms,
aerospace/defense, power, or a research lab. Reach me here or at
somisett@calpoly.edu.
```

## 3. Experience (recruiters treat these as work - never bury in "Projects/Volunteer")
Order them by EE relevance, not by date: Theta first (it is the prestige differentiator), then Natera (real-company traction + the promotion), then PEC, then CVS.

- **Creator & Lead Engineer - Theta / ThermalOS** · *Open Source · 2025–Present*
  - R_θ = ΔT/P thermal-forensics method distinguishing healthy-hot from failing-hot GPUs from NVML/DCGM telemetry.
  - Peer-relative anomaly detector **blind-validated on 72 production Princeton H100s** (3/3 degraded units caught, 0 false positives).
  - Shipped to **PyPI + Docker with green CI**; deploying to a **Cal Poly DGX B200** cluster; paper targeted at **ICPE 2027**.
  - Stack: Python, NVML/DCGM, scikit-learn, survival analysis, Docker, GitHub Actions.
- **Optimization Engineering Intern - Natera** · *Jul 2025–Present* (promoted from **Operations & Systems Engineering Intern**, Jun–Jul 2025)
  - **Promoted mid-internship by the VP of Lab Operations** for automation performance and cross-team tooling. That promotion line is the single strongest sentence in your work history - a third party with authority vouching that you outperformed. Keep it first.
  - Reframe the current bullets from generic ("optimize workflows, reduce delays, enhance throughput") to **specific systems + numbers**: what did you automate, in what stack (Python? SQL? internal tooling?), and what measurable delta resulted (hours saved/week, % throughput, error rate). One quantified bullet beats three vague ones.
  - Honest positioning: Natera is biotech and this is ops/systems-optimization, not EE-core. It does not pretend to be hardware work; it proves you ship and excel in a real org. Let Theta + the hardware projects carry the EE signal.
- **President - Poly-Engineering Consulting (PEC)** · *Cal Poly SLO · dates*
  - Lead a student engineering consulting team on real client projects. Add 1–2 concrete bullets: team size, projects delivered, what you are accountable for. Leadership of a real org is a top-1% checkbox elite programs look for.
- **Pharmacy Technician - CVS Health** · *Sep 2023–Jul 2025 · Part-time*
  - Keep it, one line. It is not EE, but a sustained part-time job through school signals reliability/work ethic and fills the timeline. Lowest priority; do not let it outweigh the engineering entries.
- **Academic systems** (own entries or Projects): EE 143 ADC→DAC pipeline · CPE 233 RISC-V OTTER CPU on FPGA · EE 241 9-stage electromechanical system.

## 4. Featured (the "proof shelf" - pin 4)
Theta **GitHub repo** · **PyPI** (`runtheta`) · **portfolio site** · **research/publication** page.

## 5. Skills (10–20, ordered by recruiter Boolean-search value; get the top ones endorsed - verified skills rank ~30% higher)
`Electrical Engineering` · `FPGA` · `SystemVerilog / RTL` · `RISC-V` · `PCB Design` · `Analog Circuit Design` · `Embedded Systems` · `Signal Processing` · `Python` · `C/C++` · `MATLAB` · `Reliability Engineering` · `GPU Computing` · `Machine Learning` · `scikit-learn` · `Docker` · `Linux` · `Data Analysis`

## 6. Education
B.S. Electrical Engineering, **California Polytechnic State University, San Luis Obispo** - Class of 2028. List relevant coursework (Digital Design, Computer Architecture, Circuits/Electronics, Signals & Systems, Materials), GPA if ≥ ~3.5, honors/scholarships.

## 7. Profile hygiene (high-leverage, low-effort)
- **Professional headshot** (~14× more views) + a **custom banner** (a Theta R_θ chart or the DGX visual).
- **Custom URL**: `linkedin.com/in/amoghsomisetty` (already clean ✓).
- **3+ recommendations** - ask a Cal Poly professor + a PEC teammate (3+ detailed recs raise credibility for the algorithm *and* humans).
- **Open to Work** → internships, your target functions/locations; "recruiters only" if you want discretion.
- **Activity**: post/repost ~1×/week (a Theta milestone, the paper, a build) - boosts ranking and gives recruiters a reason to reach out.
- **Honors & Projects** sections filled; link the GitHub repo on each project.

---

## Top-1% differentiators you should lean on
- A **shipped, validated, open-source system with a publication trajectory** as a rising junior is genuinely rare - make it the first thing anyone sees (headline + About + Featured).
- **Real silicon/hardware validation** (PCB ±1 LSB, FPGA RISC-V) signals you can do the unglamorous rigor elite programs select for.

## Gaps to close before applications (highest ROI first)
1. **An EE/hardware-domain role** - you HAVE a named industry internship now (Natera, with a promotion), which clears the "no real-company experience" bar most sophomores fail. What is still missing is a role in your *target* domain (semiconductor, hardware, FPGA, a Cal Poly EE research lab). One EE-domain position this year moves you from "strong generalist with a great side project" to "EE in the field." Pursue aggressively; the Theta partnerships (Princeton, NCSA, GWDG) and Cal Poly faculty are the warm paths.
2. **Recommendations** - 0 → 3. Ask now; they take weeks. Best sources given your history: the **Natera VP/manager who promoted you** (that rec would be gold), a Cal Poly professor, and a PEC teammate.
3. **Quantify Natera** - replace the vague bullets with one or two metric-bearing lines (see Experience). Recruiters skim for numbers.
4. **(Optional, only if leaning GPU/ML)** one **CUDA / C++ parallel-computing** artifact - closes the single skill those specific teams weight. Not needed for broad-EE prestige.
5. **Referrals** - for elite programs, an employee referral moves you past the first-72-hour resume triage. Use Cal Poly alumni and your Natera network on LinkedIn.

## Application mechanics that matter
- Elite-internship recruiters often decide the "first interview batch" within ~72 hours of a posting → **apply early**, keep "Open to Work" on.
- Keep a **strictly one-page résumé** mirroring this profile's keywords (NVIDIA et al. enforce one page for undergrads).
```
