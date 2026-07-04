// Interview questions, recruiter summaries, and resume-aligned highlights per project

export interface InterviewQA {
  question: string;
  answer: string;
}

export interface RecruiterSummary {
  whatIsIt: string;
  whyItMatters: string;
  whatYouBuilt: string;
  keyOutcomes: string[];
  skillsDemonstrated: string[];
}

export interface ResumeHighlight {
  resumeBullet: string;
  projectEvidence: string;
}

export const recruiterSummaries: Record<string, RecruiterSummary> = {
  "theta-thermalos": {
    whatIsIt: "An open-source GPU reliability agent (pip install runtheta) that computes effective thermal resistance R_θ = ΔT/P in real time from existing NVML/DCGM telemetry to separate a busy-hot GPU from a failing-hot one. No incumbent computes it.",
    whyItMatters: "Genuine GPU + ML-systems depth on production hardware: it caught real degrading H100s that temperature thresholds missed, the exact failure mode that throttles training runs and triggers RMAs in AI data centers.",
    whatYouBuilt: "Designed the R_θ method and virtual-ambient baseline, a peer-relative median-polish anomaly detector, a survival-analysis lead-time model, and a fault-state classifier. Shipped as a packaged OSS agent (PyPI, Docker, CI) with Prometheus/Slack/PagerDuty exporters and a live dashboard.",
    keyOutcomes: [
      "Blind-validated on 72 production Princeton H100s: flagged 3 degraded units (one at robust-z +15.6, two invisible to temperature thresholds) at zero false positives",
      "Decision-Tree classifier 100% 5-fold CV on steady-state data; steady-state gating took accuracy 84% → 99.8%",
      "Published to PyPI as runtheta (v0.1.10) with Docker, CI on Python 3.10/3.11/3.12, and a one-command reproduce script",
      "Honest scope: lead-time-before-throttle is simulation-validated, with hardware validation on a DGX B200 cluster in fall 2026",
    ],
    skillsDemonstrated: ["Python", "GPU Telemetry (NVML/DCGM)", "Time-Series Anomaly Detection", "Statistical Modeling", "Survival Analysis", "scikit-learn", "OSS Packaging / CI", "Systems Design"],
  },
  "ee143-signal-system": {
    whatIsIt: "A complete analog-to-digital-to-analog signal system, designed, built, and validated from raw input through conditioning, conversion, and reconstruction.",
    whyItMatters: "Demonstrates end-to-end systems ownership: designing across analog and digital boundaries, debugging loading effects, and validating output against simulation.",
    whatYouBuilt: "Full signal chain: op-amp conditioning → Arduino ADC → 4-bit digital processing → custom PCB DAC → reconstructed analog output. Verified each stage independently.",
    keyOutcomes: [
      "Designed and fabricated a 4-bit binary-weighted DAC producing 16 discrete voltage levels",
      "Fabricated PCB using Fusion 360 layout and reflow soldering, verified against LTSpice simulation",
      "Diagnosed and resolved loading effects by introducing voltage follower buffering",
      "Characterized quantization error (±½ LSB = ±31.25 mV) and documented distortion tradeoffs",
    ],
    skillsDemonstrated: ["Circuit Design", "PCB Fabrication", "Signal Conditioning", "System Integration", "Debugging", "LTSpice"],
  },
  "rgm-machine": {
    whatIsIt: "A 9-stage electromechanical chain reaction, each stage must reliably trigger the next. One failure anywhere halts the entire system.",
    whyItMatters: "Proves ability to debug complex multi-domain systems with sequential dependencies spanning electrical, mechanical, and software boundaries.",
    whatYouBuilt: "Capacitive piano → relay isolation → 580V strobe → Schmitt trigger light detector → solenoid launcher → 555 metal detector → electromagnet release → tilt switch → LCD display. Resolved 6 failure modes.",
    keyOutcomes: [
      "All 9 stages operated reliably in sequence during live demonstration",
      "Resolved 6 distinct failure modes across electrical, mechanical, and software domains",
      "Implemented frequency-domain metal detection with 5.1% shift and streak-based filtering",
      "Designed custom mechanical parts (solenoid track, sensor housing) in Fusion 360",
    ],
    skillsDemonstrated: ["Analog Design", "Embedded Programming", "Sensor Integration", "Root Cause Analysis", "System Integration", "CAD"],
  },
  "pec-nexus": {
    whatIsIt: "A role-aware internal operating system for Poly-Engineering Consulting that unifies project execution, training, scheduling, messaging, and permissions in one platform.",
    whyItMatters: "Shows product ownership and systems design: modeling how an organization actually runs and shipping it to real users, with a real permissions model and role-based workflows.",
    whatYouBuilt: "Three operating modes (Purpose, Competition, Contract) with role-aware workflows for PMs, tech leads, and members; a Mission Control command surface; unified Training; scheduling; and stage-based project execution on React + Supabase (Auth + RLS).",
    keyOutcomes: [
      "Replaced a fragmented set of club tools with one role-aware platform",
      "Designed a permissions model with row-level security and self-healing admin logic",
      "Built and rolled it out to the organization end to end",
    ],
    skillsDemonstrated: ["Product Architecture", "Role-Based Access Control", "React / TypeScript", "Supabase (Auth + RLS)", "Workflow Design", "Systems Thinking"],
  },
  "materials-phases": {
    whatIsIt: "Materials analysis tying phase diagrams, deformation history, and heat treatment to the microstructure and mechanical properties of alloys.",
    whyItMatters: "Demonstrates structure-property-processing reasoning, the core of materials and reliability engineering: predicting how processing choices change how a material behaves and fails.",
    whatYouBuilt: "Worked binary eutectic (Pb-Sn) phase-diagram interpretation, the cold-work to recrystallization to grain-growth progression, and Fe-C transformations / steel heat treatment, with an interactive phase-diagram tool.",
    keyOutcomes: [
      "Read phase fractions from tie lines via the lever rule across two-phase regions",
      "Mapped cold work to recovery to recrystallization to grain growth and its property effects",
      "Related cooling rate to pearlite/bainite/martensite and the hardness/ductility tradeoff",
    ],
    skillsDemonstrated: ["Phase Diagrams", "Microstructure Analysis", "Heat Treatment", "Structure-Property Reasoning", "Materials Selection"],
  },
  "materials-corrosion": {
    whatIsIt: "An electrochemical-corrosion analysis: the anode/cathode/electrolyte/path failure model, galvanic-series reasoning, and design strategies to prevent corrosion.",
    whyItMatters: "Corrosion is a systems-level failure mode; the same reliability mindset (find the mechanism, interrupt it by design) transfers directly to hardware reliability work.",
    whatYouBuilt: "Modeled corrosion as four required elements (anode, cathode, electrolyte, electrical path), used the galvanic series for material selection, and specified prevention strategies, with an interactive corrosion visualization.",
    keyOutcomes: [
      "Modeled the full oxidation/reduction corrosion cell and its required elements",
      "Used the galvanic series to reason about material pairings and risk",
      "Specified design strategies that interrupt the corrosion mechanism",
    ],
    skillsDemonstrated: ["Electrochemistry", "Failure Analysis", "Materials Selection", "Corrosion Prevention", "Reliability Reasoning"],
  },
  "materials-polymers": {
    whatIsIt: "Polymer mechanical-behavior analysis plus a CFRP vs 6061-T6 aluminum material-selection study for lightweight transit-vehicle design.",
    whyItMatters: "Shows quantitative material selection under real constraints (weight, strength, cost, lifecycle), the kind of tradeoff analysis engineering decisions actually turn on.",
    whatYouBuilt: "Linked thermoplastic molecular structure and secondary bonding to mechanical properties, then compared CFRP against 6061-T6 aluminum for bus-rapid-transit and rail applications, with interactive stress-strain and comparison visuals.",
    keyOutcomes: [
      "Related chain architecture and bonding to modulus, yield, and ductility",
      "Compared CFRP (~600-3000 MPa) vs 6061-T6 (~310 MPa) on specific strength and cost",
      "Framed the selection around specific strength, cost, and lifecycle",
    ],
    skillsDemonstrated: ["Materials Selection", "Mechanical Testing", "Composites", "Structure-Property Analysis", "Engineering Tradeoffs"],
  },
  "digital-systems": {
    whatIsIt: "A multi-cycle RISC-V CPU designed from logic gates up and synthesized onto an FPGA, full instruction fetch, decode, execute, and memory access.",
    whyItMatters: "Demonstrates understanding of computer architecture at the hardware level, not just writing code, but building the machine that runs it.",
    whatYouBuilt: "Complete OTTER MCU: RV32I ISA, 10 ALU operations, 2-state FSM control, 32×32 register file, dual-port memory, synthesized and verified on Basys-3 FPGA via Vivado.",
    keyOutcomes: [
      "Designed full RV32I instruction set in SystemVerilog",
      "10 ALU operations with branch condition generation",
      "2-state FSM (FETCH/EXEC) with correct timing and gating",
      "Synthesized, placed-and-routed, and verified on Basys-3 FPGA",
    ],
    skillsDemonstrated: ["SystemVerilog / HDL", "RISC-V Architecture", "FPGA Synthesis", "FSM Design", "Digital Logic", "Timing Analysis"],
  },
  "manufacturing-systems": {
    whatIsIt: "A pneumatic air motor built through the complete CAD-to-fabrication pipeline, 6 machined parts, all dimensioned per GD&T.",
    whyItMatters: "Demonstrates hands-on manufacturing ownership: from digital design to physical parts with measured tolerances and functional assembly.",
    whatYouBuilt: "6 precision-machined components on manual lathe and mill, with engineering drawings per ASME Y14.5 GD&T. Inspected with calipers and micrometers, assembled into a working motor.",
    keyOutcomes: [
      "Machined 6 parts: crank disk, cylinder, flywheel, frame, mainshaft, piston",
      "Applied GD&T per ASME Y14.5 for all engineering drawings",
      "Calculated feeds, speeds, and tooling per material and operation",
      "Assembled and validated working pneumatic air motor",
    ],
    skillsDemonstrated: ["Manual Machining (Lathe & Mill)", "CAD (SolidWorks)", "GD&T / Engineering Drawings", "Metrology", "Production Planning"],
  },
  "funck": {
    whatIsIt: "A production event ticketing platform with real payments, authentication, fraud prevention, and automated email, deployed and serving real users.",
    whyItMatters: "Demonstrates ability to ship production-grade software with integrated payment processing, database management, and operational reliability.",
    whatYouBuilt: "React/TypeScript platform with Supabase backend, Stripe payment processing with webhook verification, automated emails via Resend, live at funck.live.",
    keyOutcomes: [
      "Shipped production system at funck.live serving real users and real transactions",
      "Integrated Stripe payment processing with server-side webhook verification",
      "Built role-based access control and event management dashboard",
      "Automated transactional emails via Resend API",
    ],
    skillsDemonstrated: ["React / TypeScript", "Supabase / PostgreSQL", "Stripe Integration", "API Design", "Full-Stack Development"],
  },
  "poly-uas-jetson": {
    whatIsIt: "Carrier-board and sensor-module hardware for Cal Poly's Unmanned Aerial Systems team's NVIDIA Jetson AGX Orin, the edge-AI compute that lets the aircraft see and decide onboard instead of depending on a human operator.",
    whyItMatters: "Real, current hardware-design ownership on the exact compute platform (Jetson Orin) that GPU/edge-AI teams ship, not an analysis of someone else's product: schematics, PCB layout, power delivery, sized to a weight- and space-constrained aircraft rather than a desktop devkit.",
    whatYouBuilt: "Own the hardware layer between the airframe and the Orin module: a custom carrier board sized to the aircraft's SWaP budget and battery bus, plus the sensor modules feeding the onboard computer-vision pipeline.",
    keyOutcomes: [
      "Designing schematics and PCB layout for a custom Jetson AGX Orin carrier board (Autodesk Fusion)",
      "Sizing power delivery and SWaP budget against the airframe instead of the reference devkit form factor",
      "Designing sensor-module interfacing for the onboard CV/autonomy pipeline",
      "Honest status: boards are in design/layout, first fab + bring-up is the next milestone",
    ],
    skillsDemonstrated: ["NVIDIA Jetson AGX Orin", "PCB Design", "Power Electronics", "Sensor Interfacing", "SWaP Engineering", "Autodesk Fusion"],
  },
  "fpv-drone": {
    whatIsIt: "A 75 mm HD brushless FPV drone analyzed as a densely integrated electromechanical and RF system, six tightly coupled subsystems at 70 g.",
    whyItMatters: "Demonstrates ability to reason about a highly constrained system where power, control, RF, packaging, vibration, and performance all interact.",
    whatYouBuilt: "Comprehensive systems-level analysis: six interconnected subsystems, power architecture mapping, control-link integration analysis, and failure mode identification.",
    keyOutcomes: [
      "Analyzed embedded flight control + ESC + sensor architecture on STM32G474 AIO platform",
      "Mapped multi-rail power architecture: 2S → ESC (unregulated), 10V BEC (O3), 5V BEC (logic)",
      "Identified control-link ecosystem mismatch (ELRS vs Tracer) as a system integration challenge",
      "Documented 5 failure hotspots with cross-subsystem propagation analysis",
      "Characterized mechanical/thermal/RF packaging constraints at 70 g dry weight",
    ],
    skillsDemonstrated: ["Embedded Hardware Systems", "RF / Control-Link Architecture", "Electromechanical Integration", "Power Distribution", "Systems Analysis", "Failure Mode Analysis"],
  },
};

export const interviewQuestions: Record<string, InterviewQA[]> = {
  "ee143-signal-system": [
    {
      question: "What was the hardest part of this system?",
      answer: "Managing signal integrity and loading effects in the analog front end. The ADC input impedance drew current from the signal source, causing voltage drop. I resolved this by adding a voltage follower (unity gain buffer) between the source and ADC.",
    },
    {
      question: "How did you validate the DAC output?",
      answer: "I first simulated the binary-weighted resistor network in LTSpice to verify step response. After PCB fabrication via reflow soldering, I compared the physical staircase output against the simulation using an oscilloscope, checking each of the 16 discrete voltage levels.",
    },
    {
      question: "What would you change if you rebuilt this?",
      answer: "I'd increase to at least 8-bit resolution to reduce quantization noise, add anti-aliasing and reconstruction filters, and implement a higher sampling rate. The 4-bit resolution was intentionally limiting to study quantization effects, but it produces audible distortion.",
    },
    {
      question: "How does quantization error affect the output?",
      answer: "With 4 bits, the continuous analog signal is approximated by only 16 discrete levels, giving ±½ LSB (±31.25 mV) quantization error. This creates audible staircase artifacts in the speaker output, the fundamental tradeoff between bit depth and signal fidelity.",
    },
  ],
  "rgm-machine": [
    {
      question: "What failed and how did you fix it?",
      answer: "Six distinct failures. The most critical was a ground reference mismatch, the MOSFET controlling the electromagnet had no common ground between the Arduino (USB 5V) and external 9V supply, causing undefined gate-source voltage. Connecting both grounds fixed it immediately.",
    },
    {
      question: "How did you ensure reliable metal detection?",
      answer: "The 555 timer LC oscillator drops from 8,760 Hz to 8,310 Hz (5.1%) with the steel marble. I implemented a streak counter requiring 5 consecutive readings above threshold, plus a 600ms release delay and a fixed 150 Hz trip delta instead of noisy percentage calculations.",
    },
    {
      question: "How did you debug across 9 sequential stages?",
      answer: "I isolated each stage independently first, verifying input/output at every boundary. The strobe (Stage 3) was the hardest, a broken transistor lead in the oscillator blocked the entire downstream chain. I systematically tested each component until I found the failed lead.",
    },
    {
      question: "What's the most important lesson from this project?",
      answer: "Sequential dependency amplifies risk. Any single failure halts the entire chain. This taught me to design for testability, each stage needs independent verification points. It's the same principle used in production test engineering.",
    },
  ],
  "digital-systems": [
    {
      question: "Walk me through how an instruction executes in your CPU.",
      answer: "In the FETCH state, the PC addresses instruction memory, loading the instruction register. In EXEC, the decoder generates control signals based on opcode/funct3/funct7. For R-type: both register operands feed the ALU, result writes back to the register file. For branches: the branch condition generator produces br_eq/br_lt/br_ltu signals, and the PC MUX selects the branch target if taken.",
    },
    {
      question: "What was the hardest bug to find?",
      answer: "Branch target miscalculation. The pcSource MUX wasn't properly gated by the PCWrite signal, causing the PC to update during FETCH instead of only during EXEC. The fix was ensuring PCWrite only asserts in the EXEC state, verified through simulation waveforms.",
    },
    {
      question: "Why multi-cycle instead of pipelined?",
      answer: "Multi-cycle was the pedagogical starting point, it simplifies control by using a 2-state FSM (FETCH/EXEC). The natural next step would be a 5-stage pipeline, which I'd implement by adding IF/ID/EX/MEM/WB stages with hazard detection and forwarding logic.",
    },
  ],
  "manufacturing-systems": [
    {
      question: "How do you go from a CAD model to a finished part?",
      answer: "Start with a parametric SolidWorks model, then generate engineering drawings with GD&T per ASME Y14.5. Create a production plan specifying operations, tools, feeds/speeds. Machine on lathe and mill, then inspect dimensions with calipers (±0.001\") and micrometers (±0.0001\"). Iterate if out of tolerance.",
    },
    {
      question: "What's the gap between CAD and reality?",
      answer: "Tolerances. Real manufacturing introduces variation from tool wear, thermal expansion, fixturing, and operator technique. GD&T communicates design intent so manufacturing and inspection can verify parts independently. The CAD model is the ideal, the drawing defines what's acceptable.",
    },
  ],
  "funck": [
    {
      question: "How did you handle payments?",
      answer: "Stripe Checkout with server-side webhook handling. The webhook verifies payment completion, updates the database via Supabase, and triggers confirmation emails through Resend. This ensures the database only reflects verified transactions, not client-side claims.",
    },
    {
      question: "What's the architecture?",
      answer: "React/TypeScript frontend, Supabase (PostgreSQL + Auth + Storage) backend, Stripe for payments, Resend for transactional emails. Row-Level Security policies enforce access control at the database level. Deployed on Vercel with the backend on Supabase cloud.",
    },
  ],
  "fpv-drone": [
    {
      question: "Why is this more than just a hobby drone?",
      answer: "It's a 70-gram system where six tightly coupled subsystems, propulsion, flight control, power regulation, RF control, digital video, and mechanical packaging, all impose constraints on each other. Battery sag affects motor authority and video stability. Motor vibration degrades gyro accuracy and camera output. Antenna placement inside a carbon fiber frame creates RF dead zones. Every design choice has system-level consequences.",
    },
    {
      question: "Why does the control-link mismatch matter?",
      answer: "The onboard ELRS receiver and TBS Mambo transmitter (Tracer protocol) use incompatible RF protocols. This isn't a binding issue, it's a fundamental serial/RF architecture mismatch. Resolving it requires either an ELRS transmitter module or an external Tracer receiver, each with different UART allocation, packaging, and antenna routing implications.",
    },
    {
      question: "Why does the DJI O3 change the design trade space?",
      answer: "O3 is the heaviest single component and requires a dedicated 10V 2A regulated rail. It generates heat in an enclosed canopy, affects center of gravity, and its video quality is directly degraded by motor vibration. The entire platform's power budget, thermal management, and structural design revolve around supporting O3.",
    },
    {
      question: "What role does bidirectional DShot play?",
      answer: "Bidirectional DShot600 enables motors to report RPM back to the flight controller. This allows RPM-based notch filtering in Betaflight, critical on micro platforms where motor vibration frequencies directly overlap with gyro measurement bandwidth. Without it, gyro noise degrades PID control quality.",
    },
    {
      question: "What are the most likely failure points?",
      answer: "Battery sag under aggressive throttle (causes O3 brownout), unbalanced props or worn bearings (vibration into gyro and camera), antenna obstruction by carbon fiber frame (RF dead zones), and BEC thermal stress in enclosed canopy (regulator instability). Each failure propagates across subsystem boundaries.",
    },
  ],
};

export const resumeHighlights: Record<string, ResumeHighlight[]> = {
  "poly-uas-jetson": [
    { resumeBullet: "Own carrier-board and sensor-module hardware design for the team's NVIDIA Jetson AGX Orin edge-AI stack", projectEvidence: "Custom carrier board + sensor modules, schematic/layout in progress, sized to airframe SWaP budget" },
  ],
  "ee143-signal-system": [
    { resumeBullet: "Designed and validated a complete analog-to-digital signal processing pipeline", projectEvidence: "Full signal chain: op-amp → ADC → 4-bit processing → DAC → output" },
    { resumeBullet: "Designed and fabricated PCB for 4-bit binary-weighted DAC using Fusion 360", projectEvidence: "LTSpice simulation → PCB layout → reflow soldering → hardware validation" },
  ],
  "rgm-machine": [
    { resumeBullet: "Debugged and integrated 9-stage electromechanical system, resolving 6 failure modes across electrical, mechanical, and software domains", projectEvidence: "6 documented failure modes with root cause analysis and fixes" },
    { resumeBullet: "Implemented frequency-domain metal detection with 5.1% shift threshold and streak filtering", projectEvidence: "555 timer LC oscillator: 8,760 Hz baseline → 8,310 Hz detection" },
  ],
  "digital-systems": [
    { resumeBullet: "Designed multi-cycle RISC-V CPU (RV32I) in SystemVerilog with 10 ALU operations, synthesized on FPGA", projectEvidence: "OTTER MCU: full datapath + FSM control synthesized on Basys-3 FPGA" },
  ],
  "manufacturing-systems": [
    { resumeBullet: "Machined 6 precision parts for pneumatic air motor on manual lathe and mill per ASME Y14.5 GD&T", projectEvidence: "Crank disk, cylinder, flywheel, frame, mainshaft, piston, all per GD&T specs" },
  ],
  "funck": [
    { resumeBullet: "Built and deployed full-stack event platform with Stripe payment processing at funck.live", projectEvidence: "Live production system with auth, payments, email, and role-based access" },
  ],
  "fpv-drone": [
    { resumeBullet: "Analyzed and documented tightly integrated FPV flight system across 6 coupled subsystems", projectEvidence: "Propulsion, flight control, power, RF, video, and structure analyzed as coupled system" },
    { resumeBullet: "Identified control-link architecture mismatch and evaluated integration paths", projectEvidence: "ELRS vs Tracer protocol incompatibility, serial/RF architecture analysis" },
    { resumeBullet: "Mapped multi-rail power distribution with failure propagation analysis", projectEvidence: "2S → ESC (unregulated) + 10V BEC (O3) + 5V BEC (logic) with 5 documented failure hotspots" },
  ],
};
