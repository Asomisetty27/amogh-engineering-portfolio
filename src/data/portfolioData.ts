// ========== PORTFOLIO DATA MODEL ==========
// Every numeric value includes evidence_source and confidence badge.

export type ConfidenceBadge = "VERIFIED" | "CONCEPTUAL";

export interface EvidenceItem {
  id: string;
  fileName: string;
  page?: number;
  type: "pdf" | "image" | "screenshot" | "code" | "link";
  description: string;
  path?: string;
  url?: string;
}

export interface TrackedValue {
  value: string | number;
  unit?: string;
  evidence_source?: string;
  confidence: ConfidenceBadge;
}

export interface DiagramItem {
  id: string;
  title: string;
  confidence: ConfidenceBadge;
  derivedFrom: string[];
  description: string;
  imagePath?: string;
  conceptualNote?: string;
  engineeringNote?: boolean; // if true, shown only in Engineering Notes accordion
}

export interface FailureMode {
  issue: string;
  fix: string;
  evidence_source?: string;
  confidence: ConfidenceBadge;
}

export interface VerificationRow {
  parameter: string;
  value: string;
  unit: string;
  evidence_source: string;
  confidence: ConfidenceBadge;
}

export interface ProjectModule {
  missionObjective: string;
  systemArchitecture: string;
  implementationNotes: string[];
  failureModes: FailureMode[];
  improvements: string[];
  verificationSummary?: VerificationRow[];
  ownershipDisclosure?: { owned: string[]; aiAssisted: string[] };
}

export type ProjectCategory = "Hardware" | "Systems" | "Ops" | "Web";
export type ProjectStatus = "COMPLETE" | "IN_PROGRESS" | "ARCHIVED" | "ACTIVE";

export interface Project {
  id: string;
  name: string;
  codename: string;
  category: ProjectCategory;
  status: ProjectStatus;
  course?: string;
  statusColor: string;
  module: ProjectModule;
  diagrams: DiagramItem[];
  evidence: EvidenceItem[];
  techStack: string[];
  archived?: boolean; // moved to archive/evidence-pending
  heroSummary: string; // concise 1-line summary for recruiter mode
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  period: string;
  bullets: { text: string; confidence: ConfidenceBadge; evidence_source?: string }[];
  processImprovement?: {
    before: string;
    after: string;
    whatChanged: string[];
    measurementMethod: string;
  };
}

// ========== PROJECT DATA ==========

export const projects: Project[] = [
  {
    id: "otter-cpu",
    name: "OTTER Multi-Cycle RISC-V CPU",
    codename: "OTTER",
    category: "Hardware",
    course: "CPE 233",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Multi-cycle RISC-V processor designed in SystemVerilog with full RV32I instruction support, dual-port memory, and FSM control unit.",
    module: {
      missionObjective:
        "Design and implement a multi-cycle RISC-V processor (OTTER MCU) in SystemVerilog, supporting the RV32I base instruction set with PC, register file, ALU, memory, immediate generation, branch logic, and a finite state machine control unit.",
      systemArchitecture:
        "Multi-cycle RISC-V datapath with: Program Counter (PC), Instruction Memory (IMEM), Register File (32x32), ALU (add, sub, and, or, xor, slt, sra, srl, sll, lui-copy), Immediate Generator (I/S/B/U/J types), Branch Condition Generator, Control Unit FSM (CU_FSM + CU_DCDR), and Memory module with byte/half/word access.",
      implementationNotes: [
        "PC supports 4 sources via pcSource MUX: PC+4, jalr, branch, jal",
        "ALU function selected by 4-bit alu_fun from CU_DCDR (opcode bits [30,14:12,6:0])",
        "Branch Cond Gen outputs: br_eq, br_lt, br_ltu fed to CU_DCDR",
        "Register file: dual-read (rs1, rs2), single-write with rf_wr_sel MUX (3 sources: PC+4, CSR_reg, DOUT2/memory)",
        "Memory: dual-port (ADDR1=PC for instruction fetch, ADDR2=ALU result for data), supports RDEN1, RDEN2, WE2, SIZE, SIGN controls",
        "Control FSM states: FETCH → EXEC (2-cycle minimum)",
        "Immediate Gen decodes ir[31:7] into I, S, B, U, J type immediates",
        "IOBUS interface: IO_IN, IO_WR, IOBUS_OUT, IOBUS_ADDR, IOBUS_WR for peripheral access",
      ],
      failureModes: [
        {
          issue: "Branch target miscalculation when pcSource MUX not properly gated by PCWrite",
          fix: "Ensured PCWrite signal only asserts during EXEC state; verified branch address generation through BRANCH_ADDR_GEN module",
          evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1",
          confidence: "VERIFIED",
        },
      ],
      improvements: [
        "Add pipeline stages (IF/ID/EX/MEM/WB) for performance",
        "Implement interrupt handling (INTR, CSR_reg path visible in architecture)",
        "Add hazard detection and forwarding logic",
        "Expand to RV32IM (multiply/divide extension)",
      ],
      verificationSummary: [
        { parameter: "ISA", value: "RV32I", unit: "", evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1", confidence: "VERIFIED" },
        { parameter: "ALU Operations", value: "10", unit: "functions", evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1", confidence: "VERIFIED" },
        { parameter: "Register File", value: "32×32", unit: "bit", evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1", confidence: "VERIFIED" },
        { parameter: "FSM States", value: "2", unit: "(FETCH, EXEC)", evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1", confidence: "VERIFIED" },
        { parameter: "PC Sources", value: "4", unit: "MUX inputs", evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1", confidence: "VERIFIED" },
      ],
    },
    diagrams: [
      {
        id: "otter-datapath-verified",
        title: "OTTER MCU Full Datapath",
        confidence: "VERIFIED",
        derivedFrom: ["OTTER_Architecture_No_Interrupts_1.pdf"],
        description:
          "Complete RISC-V OTTER MCU datapath showing PC, IMEM, Register File, ALU, Immediate Gen, Branch Cond Gen, Branch Addr Gen, CU_FSM, CU_DCDR, Memory, and IOBUS interface.",
        imagePath: "/evidence/otter-datapath.jpg",
      },
      {
        id: "otter-alu-ops",
        title: "ALU Operations Table",
        confidence: "VERIFIED",
        derivedFrom: ["OTTER_Architecture_No_Interrupts_1.pdf"],
        description:
          "ALU function codes: 0000=add, 1000=sub, 0110=or, 0111=and, 0100=xor, 0010=slt, 0011=sltu, 0101=sra, 0001=sll, 1001=lui-copy",
      },
      {
        id: "otter-fsm-conceptual",
        title: "Control Unit State Machine",
        confidence: "CONCEPTUAL",
        derivedFrom: ["OTTER_Architecture_No_Interrupts_1.pdf"],
        description:
          "Two-state FSM: FETCH (assert memRDEN1, load IR) → EXEC (decode opcode, assert control signals, write results).",
        conceptualNote:
          "State transitions inferred from architecture diagram. Detailed state encoding not directly shown in uploaded evidence.",
        engineeringNote: true,
      },
    ],
    evidence: [
      {
        id: "otter-arch-pdf",
        fileName: "OTTER_Architecture_No_Interrupts_1.pdf",
        type: "pdf",
        description: "Full OTTER MCU architecture diagram with datapath, control unit, and ALU operations table",
        path: "/evidence/otter-datapath.jpg",
      },
      {
        id: "riscv-asm-manual",
        fileName: "RISC-V_Assembler_Manual.pdf",
        type: "pdf",
        description:
          "RISC-V OTTER Assembly Language Manual v4.04 by James Mealy & Paul Hummel. Covers ISA formats, opcodes, instruction descriptions.",
      },
    ],
    techStack: ["SystemVerilog", "Vivado", "RISC-V ISA", "FPGA"],
  },
  {
    id: "metal-detector",
    name: "Metal Detector & Solenoid Integration",
    codename: "DETECT-7",
    category: "Hardware",
    course: "EE 241",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "555 timer LC oscillator detects metal via frequency shift; MOSFET/BJT drives solenoid & electromagnet in response.",
    module: {
      missionObjective:
        "Build a metal detector front-end using a 555 timer oscillator circuit, then integrate with a solenoid back-end driven by a MOSFET/BJT transistor. Detect metal presence via frequency shift in the LC oscillator and actuate a solenoid in response.",
      systemArchitecture:
        "Front-end: TLC555 timer in astable mode with 0.5mH inductor (L1), 2.2µF capacitors (C2, C3), 47kΩ (R4), 10kΩ (R1, R3), 12kΩ (R2) resistors, 0.1µF CV cap (C1), two 1N4001 diodes, 9V supply. Back-end: Solenoid driven via N-Ch MOSFET (FET N-Ch 30V 40A) or BJT (TIP1E), with flyback diode (1N4004/MUR348) and base resistor (1K or 2.2K).",
      implementationNotes: [
        "555 timer oscillator frequency determined by LC network (L1=0.5mH, C=2.2µF)",
        "Metal proximity shifts inductance of L1, changing oscillation frequency",
        "555 circuit operates at approximately 8 kHz (EE_241_Lab_7, p5)",
        "Frequency threshold comparison triggers MOSFET gate to drive solenoid",
        "Flyback diode (D1: 1N4004 or MUR348) protects MOSFET from back-EMF",
        "Electromagnet holding force: 2.5 kg (from 5V electromagnet spec, EE_241_Lab_7, p1)",
        "B = μ₀μᵣ(N/l)I — magnetic field strength equation for electromagnet (EE_241_Lab_7, p3)",
      ],
      failureModes: [
        {
          issue: "Solenoid back-EMF damaging MOSFET without flyback diode",
          fix: "Added 1N4004 flyback diode across solenoid coil",
          evidence_source: "EE_241_Lab_7_Electric_Circuit_Analysis.pdf, p1",
          confidence: "VERIFIED",
        },
      ],
      improvements: [
        "Add digital frequency counter for precise threshold detection",
        "Implement adjustable sensitivity via potentiometer",
        "Add visual/audio indicator for detection events",
      ],
      verificationSummary: [
        { parameter: "Operating Frequency", value: "~8", unit: "kHz", evidence_source: "EE_241_Lab_7, p5", confidence: "VERIFIED" },
        { parameter: "Inductor (L1)", value: "0.5", unit: "mH", evidence_source: "EE_241_Lab_6, schematic", confidence: "VERIFIED" },
        { parameter: "Capacitor (C2, C3)", value: "2.2", unit: "µF", evidence_source: "EE_241_Lab_6, schematic", confidence: "VERIFIED" },
        { parameter: "Supply Voltage", value: "9", unit: "VDC", evidence_source: "EE_241_Lab_6, schematic", confidence: "VERIFIED" },
        { parameter: "Electromagnet Hold Force", value: "2.5", unit: "kg", evidence_source: "EE_241_Lab_7, p1", confidence: "VERIFIED" },
        { parameter: "MOSFET Rating", value: "30V / 40A", unit: "N-Ch FET", evidence_source: "EE_241_Lab_7, p2", confidence: "VERIFIED" },
        { parameter: "Flyback Diode", value: "1N4004 / MUR348", unit: "", evidence_source: "EE_241_Lab_7, p1", confidence: "VERIFIED" },
      ],
    },
    diagrams: [
      {
        id: "lab6-555-schematic",
        title: "555 Timer Metal Detector Schematic",
        confidence: "VERIFIED",
        derivedFrom: ["EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf"],
        description:
          "TLC555 timer circuit with L1=0.5mH, C2/C3=2.2µF, R1=10K, R2=12K, R3=10K, R4=47K, C1=0.1µF, 9VDC supply.",
        imagePath: "/evidence/ee241-lab6-555timer.jpg",
      },
      {
        id: "lab7-drive-circuit",
        title: "Solenoid Drive Circuit (BJT)",
        confidence: "VERIFIED",
        derivedFrom: ["EE_241_Lab_7_Electric_Circuit_Analysis.pdf"],
        description:
          "BJT (TIP1E) drive circuit: base resistor (1K or 2.2K), flyback diode (1N4004/MUR348) across solenoid, collector to solenoid, emitter to GND.",
        imagePath: "/evidence/ee241-lab7-drive-circuit.png",
      },
      {
        id: "metal-detector-system",
        title: "Full System Block Diagram",
        confidence: "CONCEPTUAL",
        derivedFrom: ["EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf", "EE_241_Lab_7_Electric_Circuit_Analysis.pdf"],
        description:
          "555 Timer Oscillator → Frequency Measurement → Threshold Comparator → MOSFET/BJT Driver → Solenoid Actuator",
        conceptualNote:
          "System-level block diagram inferred from lab 6 (front-end) and lab 7 (back-end) descriptions.",
        engineeringNote: true,
      },
    ],
    evidence: [
      {
        id: "lab6-pdf",
        fileName: "EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf",
        type: "pdf",
        description: "Lab 6: 555 Timer Metal Detector schematic and RLC step response analysis.",
        path: "/evidence/ee241-lab6-555timer.jpg",
      },
      {
        id: "lab7-pdf",
        fileName: "EE_241_Lab_7_Electric_Circuit_Analysis.pdf",
        type: "pdf",
        description: "Lab 7: Solenoid & Electromagnet integration, drive circuit, B-field equation.",
        path: "/evidence/ee241-lab7-solenoid.jpg",
      },
    ],
    techStack: ["Analog Circuits", "555 Timer", "LTSpice", "Oscilloscope", "Soldering"],
  },
  {
    id: "air-motor",
    name: "Manufacturing Skills — Pneumatic Air Motor",
    codename: "AERO-MFG",
    category: "Hardware",
    course: "IME 144",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Precision-machined pneumatic air motor: lathe, mill, GD&T, and production planning for 6 custom parts.",
    module: {
      missionObjective:
        "Design and manufacture a functional pneumatic air motor through precision machining processes including turning (lathe) and milling operations. Develop production planning, engineering drawings, GD&T, and hands-on fabrication skills.",
      systemArchitecture:
        "Air motor assembly: Crank Disk, Cylinder, Flywheel, Frame, Mainshaft, Piston. Manufactured using manual lathe and milling machines with specified feeds, speeds, and tolerances per engineering drawing packet.",
      implementationNotes: [
        "Parts manufactured: Crank Disk, Cylinder, Flywheel, Frame, Mainshaft, Piston",
        "Processes: Turning operations (lathe), Milling operations, Sawing, Threading, Broaching",
        "Measuring: Calipers, Micrometers, Dial indicators, Gage blocks",
        "GD&T applied per ASME Y14.5 standard",
        "Cutting tool feeds & speeds calculated per material and operation",
        "Production planning documents created for each part",
      ],
      failureModes: [],
      improvements: [
        "Explore CNC machining for higher precision repeatability",
        "Consider alternative materials (aluminum alloys) for weight reduction",
      ],
    },
    diagrams: [
      {
        id: "ime144-cover-verified",
        title: "Air Motor Assembly Reference",
        confidence: "VERIFIED",
        derivedFrom: ["IME_144_MANUAL.pdf"],
        description:
          "Air motor assembly illustration from IME 144 course manual showing frame, cylinder, flywheel, piston, mainshaft, and crank disk.",
        imagePath: "/evidence/ime144-cover.jpg",
      },
      {
        id: "air-motor-process",
        title: "Manufacturing Process Flow",
        confidence: "CONCEPTUAL",
        derivedFrom: ["IME_144_MANUAL.pdf"],
        description:
          "Raw Stock → Sawing → Lathe Turning → Mill Operations → Threading/Broaching → Inspection (GD&T) → Assembly → Pneumatic Test",
        conceptualNote:
          "Process flow inferred from Table of Contents (pp. 236-285). Actual process sheets not extracted.",
        engineeringNote: true,
      },
    ],
    evidence: [
      {
        id: "ime144-manual",
        fileName: "IME_144_MANUAL.pdf",
        type: "pdf",
        description:
          "Full IME 144 Manual (Georgeou): engineering drawings, GD&T, machining processes, feeds & speeds, air motor project (pp.224-285).",
        path: "/evidence/ime144-cover.jpg",
      },
    ],
    techStack: ["Manual Lathe", "Manual Mill", "GD&T", "Metrology", "Production Planning"],
  },
  {
    id: "rgm-machine",
    name: "RGM Machine",
    codename: "RGM",
    category: "Systems",
    course: "EE 241",
    status: "ARCHIVED",
    statusColor: "neon-amber",
    archived: true,
    heroSummary: "Multi-stage Rube Goldberg Machine integrating piano, strobe, light detector, metal detector, solenoid, and electromagnet.",
    module: {
      missionObjective:
        "Integrate four lab circuits (capacitive piano, strobe light, light detector, metal detector) with solenoid and electromagnet into a multi-stage Rube Goldberg Machine. Piano triggers strobe → light detector energizes solenoid → metal detector controls electromagnet via MOSFET.",
      systemArchitecture:
        "Stage flow: Capacitive Piano (key sequence) → Arduino relay → Strobe Light → Light Detector → Solenoid actuation → Metal Detector (555 at ~8 kHz) → Arduino frequency change → MOSFET → Electromagnet de-magnetize → Ball release. System integration across all EE 241 labs.",
      implementationNotes: [
        "Piano is the required first stage — correct key sequence triggers the chain",
        "Strobe light activation triggers the light detector",
        "Light detector output energizes the solenoid (shaft movement)",
        "Metal detector circuit operates at ~8 kHz, ball/no-ball indication",
        "MOSFET-controlled electromagnet de-magnetizes on frequency change detection",
        "All stages mounted on a single supporting structure for reliability",
      ],
      failureModes: [],
      improvements: [],
    },
    diagrams: [],
    evidence: [],
    techStack: ["Arduino", "555 Timer", "MOSFET", "Solenoid", "Electromagnet"],
  },
  {
    id: "funck",
    name: "Funck — Event Ticketing Platform",
    codename: "FUNCK",
    category: "Web",
    status: "ACTIVE",
    statusColor: "neon-cyan",
    heroSummary: "Live event ticketing platform with QR tickets, Stripe payments, fraud prevention, and demand-based pricing.",
    module: {
      missionObjective:
        "Build and operate a live event ticketing platform with presale tickets, QR code ticket issuance, fraud prevention at the door, demand-based pricing logic, Stripe Connect payouts, group split-pay, and analytics/logging.",
      systemArchitecture:
        "Client (React) → Lovable App → Supabase (PostgreSQL + Auth + Edge Functions) → Stripe (payments + Connect payouts) → Resend (email delivery). QR ticket lifecycle managed server-side.",
      implementationNotes: [
        "Built using Lovable, Supabase, Stripe, Resend",
        "Live at www.funck.live",
        "Features: presale tickets, QR ticket issuance, fraud prevention at door scan",
        "Demand-based pricing logic",
        "Stripe Connect for organizer payouts",
        "Group split-pay functionality",
        "Analytics and logging dashboard",
      ],
      failureModes: [],
      improvements: [
        "Add concurrency controls for ticket purchase race conditions",
        "Implement idempotency keys for Stripe payment intents",
        "Add rate limiting on ticket scan endpoint",
        "Load testing for high-demand event scenarios",
      ],
      ownershipDisclosure: {
        owned: [
          "Product requirements and feature scoping",
          "Integration architecture decisions (Stripe Connect, Supabase, Resend)",
          "Testing and QA across payment flows",
          "Deployment and production operations",
          "User feedback and iteration",
        ],
        aiAssisted: [
          "Code generation via Lovable AI",
        ],
      },
    },
    diagrams: [
      {
        id: "funck-arch",
        title: "Platform Architecture",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description:
          "Client (React/Lovable) → Supabase (DB + Auth + Edge Functions) → Stripe (Payments + Connect) → Resend (Emails)",
        conceptualNote: "Architecture based on stated tech stack. Reflects actual production system at funck.live.",
      },
      {
        id: "funck-ticket-fsm",
        title: "Ticket Lifecycle State Machine",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description:
          "UNPAID → PAID → ISSUED (QR generated) → SCANNED (at door) → LOCKED (fraud prevention, no re-scan)",
        conceptualNote: "State machine reflects designed ticket flow.",
        engineeringNote: true,
      },
    ],
    evidence: [
      {
        id: "funck-live",
        fileName: "www.funck.live",
        type: "link",
        description: "Live production URL for the Funck event ticketing platform",
        url: "https://www.funck.live",
      },
    ],
    techStack: ["React", "Lovable", "Supabase", "Stripe", "Resend", "TypeScript"],
  },
];

// ========== EXPERIENCE DATA ==========

export const experiences: ExperienceItem[] = [
  {
    company: "Natera",
    role: "Intern",
    location: "Pleasanton, CA",
    period: "Summer 2024",
    bullets: [
      {
        text: "Improved validation and packaging workflow from ~20 min to ~10–12 min through bottleneck removal and workflow standardization",
        confidence: "CONCEPTUAL",
        evidence_source: "Observed estimate — formal time study pending",
      },
      {
        text: "Identified and removed redundant verification steps that did not affect quality outcomes",
        confidence: "CONCEPTUAL",
        evidence_source: "Observed estimate",
      },
      {
        text: "Documented standardized packaging procedures for team reference",
        confidence: "CONCEPTUAL",
        evidence_source: "Observed estimate",
      },
    ],
    processImprovement: {
      before: "~20 min per validation + packaging cycle (observed estimate)",
      after: "~10–12 min per cycle (observed estimate)",
      whatChanged: [
        "Identified bottleneck in sequential verification steps",
        "Removed redundant checks that didn't affect quality",
        "Standardized packaging workflow sequence",
        "Created reference documentation for consistency",
      ],
      measurementMethod: "Observed estimate based on timed walkthroughs. Formal time study with statistical sampling not conducted.",
    },
  },
  {
    company: "CVS Pharmacy",
    role: "Pharmacy Technician",
    location: "Dublin, CA",
    period: "June 2023 – June 2024",
    bullets: [
      {
        text: "California state certified pharmacy technician — processed prescriptions, managed inventory, and provided customer consultations",
        confidence: "VERIFIED",
      },
      {
        text: "Handled high-volume prescription fulfillment with attention to accuracy and regulatory compliance",
        confidence: "VERIFIED",
      },
    ],
  },
];

// ========== SKILLS ==========

export const skills = {
  core: ["Systems Thinking", "Test & Validation Mindset", "Technical Documentation", "Customer Service"],
  technical: [
    { name: "SystemVerilog / HDL", evidence: "OTTER CPU project (CPE 233)", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Analog Circuit Design", evidence: "EE 241 Labs 1-7", confidence: "VERIFIED" as ConfidenceBadge },
    {
      name: "Manual Machining (Lathe & Mill)",
      evidence: "IME 144 Air Motor project",
      confidence: "VERIFIED" as ConfidenceBadge,
    },
    { name: "GD&T / Engineering Drawings", evidence: "IME 144 Manual", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "CAD / Hand Drafting", evidence: "IME 144 coursework", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "RISC-V Assembly", evidence: "RISC-V_Assembler_Manual.pdf", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "LTSpice Simulation", evidence: "EE 241 Lab 6", confidence: "VERIFIED" as ConfidenceBadge },
    {
      name: "Web Development (React/TS)",
      evidence: "Funck platform (funck.live)",
      confidence: "VERIFIED" as ConfidenceBadge,
    },
    { name: "Soldering & Prototyping", evidence: "EE 241 lab work", confidence: "VERIFIED" as ConfidenceBadge },
    {
      name: "Test Equipment (Scope/FGen)",
      evidence: "EE 241 lab equipment usage",
      confidence: "VERIFIED" as ConfidenceBadge,
    },
  ],
};

// ========== PERSONAL INFO ==========

export const personalInfo = {
  name: "Amogh Somisetty",
  title: "Electrical Engineering Student",
  university: "California Polytechnic State University, San Luis Obispo",
  phone: "(925) 236-2600",
  email: "somisett@calpoly.edu",
  extras: [
    "Varsity wrestling athlete (high school)",
    "California state certified pharmacy technician",
    "Boy Scouts — 11 years",
    "Previously CPR/First Aid certified; open to recertification",
  ],
};

// ========== WALKTHROUGH SCRIPTS ==========

export const walkthroughScripts = {
  oneMinute: [
    "\"I'm Amogh, EE student at Cal Poly SLO. I build things that work — from RISC-V CPUs in SystemVerilog to live event ticketing platforms.\"",
    "Show: OTTER datapath diagram → \"Designed a multi-cycle RISC-V processor with 10 ALU operations and dual-port memory.\"",
    "Show: Metal Detector → \"Built a 555-timer metal detector with solenoid actuation — frequency shift detection at 8 kHz.\"",
    "Show: Funck → \"Shipped a live ticketing platform with Stripe payments, QR tickets, and fraud prevention at funck.live.\"",
  ],
  threeMinute: [
    "Start with 1-minute script above.",
    "OTTER deep dive: Walk through datapath diagram — explain PC source MUX, ALU function select, branch condition generation. Mention the FETCH→EXEC FSM.",
    "Metal Detector: Show verification summary table — 8 kHz operating frequency, 0.5mH inductor, flyback diode protection. Show the 555 timer schematic.",
    "Funck: Explain ownership — you defined requirements, chose the integration architecture (Stripe Connect + Supabase + Resend), tested payment flows, deployed to production. AI assisted with code generation.",
    "Natera: Explain process improvement — observed ~40% time reduction in validation/packaging workflow through bottleneck removal.",
  ],
  tenMinute: [
    "Follow 3-minute structure with these additions:",
    "OTTER: Discuss ALU operations table in detail. Explain immediate generation for all 5 types (I/S/B/U/J). Discuss branch target calculation and PCWrite gating issue you resolved.",
    "Metal Detector: Explain 555 timer astable mode, LC oscillation principle, how metal shifts inductance. Walk through drive circuit — BJT vs MOSFET choice, flyback diode necessity. Discuss B = μ₀μᵣ(N/l)I for electromagnet.",
    "Air Motor: Brief manufacturing skills snapshot — explain lathe/mill operations, GD&T, production planning for 6 parts.",
    "Funck: Walk through ticket lifecycle (Unpaid→Paid→Issued→Scanned→Locked). Discuss engineering improvements you'd make (concurrency, idempotency, rate limiting). Show live demo if possible.",
    "Natera: Detail the process improvement methodology — what you observed, what you changed, measurement approach and its limitations.",
    "Skills: Highlight systems thinking thread across hardware (CPU), analog (circuits), manufacturing, and software.",
  ],
};
