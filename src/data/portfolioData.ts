// ========== PORTFOLIO DATA MODEL ==========
// Every numeric value includes evidence_source and confidence badge.

export type ConfidenceBadge = "VERIFIED" | "CONCEPTUAL";

export interface EvidenceItem {
  id: string;
  fileName: string;
  page?: number;
  type: "pdf" | "image" | "screenshot" | "code" | "link";
  description: string;
  path?: string; // local path if copied
  url?: string;  // external URL
}

export interface TrackedValue {
  value: string | number;
  unit?: string;
  evidence_source?: string; // file + page
  confidence: ConfidenceBadge;
}

export interface DiagramItem {
  id: string;
  title: string;
  confidence: ConfidenceBadge;
  derivedFrom: string[]; // evidence file names
  description: string;
  imagePath?: string;
  conceptualNote?: string;
}

export interface FailureMode {
  issue: string;
  fix: string;
  evidence_source?: string;
  confidence: ConfidenceBadge;
}

export interface ProjectModule {
  missionObjective: string;
  systemArchitecture: string;
  implementationNotes: string[];
  failureModes: FailureMode[];
  improvements: string[];
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
  statusColor: string; // tailwind color class
  module: ProjectModule;
  diagrams: DiagramItem[];
  evidence: EvidenceItem[];
  techStack: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  period: string;
  bullets: { text: string; confidence: ConfidenceBadge; evidence_source?: string }[];
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
        {
          issue: "TODO: Document additional failure modes from testing",
          fix: "TODO",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Add pipeline stages (IF/ID/EX/MEM/WB) for performance",
        "Implement interrupt handling (INTR, CSR_reg path visible in architecture)",
        "Add hazard detection and forwarding logic",
        "Expand to RV32IM (multiply/divide extension)",
      ],
    },
    diagrams: [
      {
        id: "otter-datapath-verified",
        title: "OTTER MCU Full Datapath",
        confidence: "VERIFIED",
        derivedFrom: ["OTTER_Architecture_No_Interrupts_1.pdf"],
        description:
          "Complete RISC-V OTTER MCU datapath showing PC, IMEM (via Memory ADDR1), Register File, ALU, Immediate Gen, Branch Cond Gen, Branch Addr Gen, CU_FSM, CU_DCDR, Memory, and IOBUS interface. Control signals: PCWrite, regWrite, memRDEN1, memRDEN2, memWE2, alu_srcA, alu_srcB, alu_fun, pcSource, rf_wr_sel, reset.",
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
          "Two-state FSM: FETCH (assert memRDEN1, load IR) → EXEC (decode opcode, assert control signals, write results). Derived from CU_FSM block visible in datapath.",
        conceptualNote:
          "State transitions inferred from architecture diagram. Detailed state encoding not directly shown in uploaded evidence.",
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
        description: "RISC-V OTTER Assembly Language Manual v4.04 by James Mealy & Paul Hummel. Covers ISA formats, opcodes, instruction descriptions, memory map, and register conventions.",
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
    module: {
      missionObjective:
        "Build a metal detector front-end using a 555 timer oscillator circuit, then integrate with a solenoid back-end driven by a MOSFET/BJT transistor. Detect metal presence via frequency shift in the LC oscillator and actuate a solenoid in response.",
      systemArchitecture:
        "Front-end: TLC555 timer in astable mode with 0.5mH inductor (L1), 2.2µF capacitors (C2, C3), 47kΩ (R4), 10kΩ (R1, R3), 12kΩ (R2) resistors, 0.1µF CV cap (C1), two 1N4001 diodes, 9V supply. Back-end: Solenoid driven via N-Ch MOSFET (FET N-Ch 30V 40A) or BJT (TIP1E), with flyback diode (1N4004/MUR348) and base resistor (1K or 2.2K).",
      implementationNotes: [
        "555 timer oscillator frequency determined by LC network (L1=0.5mH, C=2.2µF)",
        "Metal proximity shifts inductance of L1, changing oscillation frequency",
        "Frequency threshold comparison triggers MOSFET gate to drive solenoid",
        "Flyback diode (D1: 1N4004 or MUR348) protects MOSFET from back-EMF",
        "Electromagnet holding force: 2.5 kg (from 5V electromagnet spec)",
        "Lab also covered 2nd-order RLC step response: underdamped analysis (frequency, overshoot, rise time, settling time)",
        "B = μ₀μᵣ(N/l)I — magnetic field strength equation for electromagnet",
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
    },
    diagrams: [
      {
        id: "lab6-555-schematic",
        title: "555 Timer Metal Detector Schematic (LTSpice)",
        confidence: "VERIFIED",
        derivedFrom: ["EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf"],
        description:
          "TLC555 timer circuit with L1=0.5mH, C2/C3=2.2µF, R1=10K, R2=12K, R3=10K, R4=47K, C1=0.1µF, 9VDC supply. Netting points connect TRIG-THRS.",
        imagePath: "/evidence/ee241-lab6-555timer.jpg",
      },
      {
        id: "lab7-drive-circuit",
        title: "Solenoid Drive Circuit",
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
          "System-level block diagram inferred from lab 6 (front-end) and lab 7 (back-end) descriptions. No single integrated schematic uploaded.",
      },
    ],
    evidence: [
      {
        id: "lab6-pdf",
        fileName: "EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf",
        type: "pdf",
        description: "Lab 6: 2nd Order Response & 555 Timer Metal Detector. Contains 555 timer schematic, RLC step response analysis requirements.",
        path: "/evidence/ee241-lab6-555timer.jpg",
      },
      {
        id: "lab7-pdf",
        fileName: "EE_241_Lab_7_Electric_Circuit_Analysis.pdf",
        type: "pdf",
        description: "Lab 7: Metal Detector (cont.) — Solenoid & Electromagnet integration. Contains drive circuit schematic, solenoid background, B-field equation.",
        path: "/evidence/ee241-lab7-solenoid.jpg",
      },
    ],
    techStack: ["Analog Circuits", "555 Timer", "LTSpice", "Oscilloscope", "Soldering"],
  },
  {
    id: "air-motor",
    name: "Pneumatic Air Motor",
    codename: "AERO-MFG",
    category: "Hardware",
    course: "IME 144",
    status: "COMPLETE",
    statusColor: "neon-green",
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
        "Material conditions: MMC, LMC, RFS considerations",
        "Cutting tool feeds & speeds calculated per material and operation",
        "Production planning documents created for each part",
      ],
      failureModes: [
        {
          issue: "TODO: Document specific machining issues encountered",
          fix: "TODO",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Add CNC machining for higher precision repeatability",
        "Explore alternative materials (aluminum alloys) for weight reduction",
        "Design custom intake/exhaust valve timing for efficiency",
      ],
    },
    diagrams: [
      {
        id: "ime144-cover-verified",
        title: "IME 144 Air Motor Assembly Reference",
        confidence: "VERIFIED",
        derivedFrom: ["IME_144_MANUAL.pdf"],
        description: "Air motor assembly illustration from IME 144 course manual cover, showing frame, cylinder, flywheel, piston, mainshaft, and crank disk components.",
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
          "Process flow inferred from Table of Contents listing (pp. 236-285) of individual part manufacturing documents. Actual process sheets not extracted.",
      },
    ],
    evidence: [
      {
        id: "ime144-manual",
        fileName: "IME_144_MANUAL.pdf",
        type: "pdf",
        description:
          "Full IME 144 Lecture & Lab Manual (Georgeou). Contains: engineering drawings, GD&T, measuring devices, machining processes (turning pp.31-37, milling pp.38-46), feeds & speeds, air motor project overview (pp.224-227), engineering drawing packet (pp.227-234), and manufacturing documents for all 6 parts (pp.236-285).",
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
    status: "COMPLETE",
    statusColor: "neon-amber",
    module: {
      missionObjective:
        "TODO: Add specific mission objective from project documentation",
      systemArchitecture:
        "TODO: Architecture details pending — upload final schematic, state diagram, or report",
      implementationNotes: [
        "TODO: Implementation details pending evidence upload",
      ],
      failureModes: [],
      improvements: [
        "TODO: Improvements pending project documentation",
      ],
    },
    diagrams: [
      {
        id: "rgm-placeholder",
        title: "RGM System Diagram",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description: "TODO: No evidence uploaded for RGM Machine project",
        conceptualNote: "Simulation evidence not uploaded yet. Upload final schematic, state diagram, or report to generate verified diagrams.",
      },
    ],
    evidence: [],
    techStack: ["TODO"],
  },
  {
    id: "funck",
    name: "Funck — Event Ticketing Platform",
    codename: "FUNCK",
    category: "Web",
    status: "ACTIVE",
    statusColor: "neon-cyan",
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
      failureModes: [
        {
          issue: "TODO: Document observed failure modes",
          fix: "TODO",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Engineering TODO: Add concurrency controls for ticket purchase race conditions",
        "Engineering TODO: Implement idempotency keys for Stripe payment intents",
        "Engineering TODO: Add rate limiting on ticket scan endpoint",
        "Engineering TODO: Load testing for high-demand event scenarios",
      ],
    },
    diagrams: [
      {
        id: "funck-arch",
        title: "Platform Architecture",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description:
          "Client (React/Lovable) → Supabase (DB + Auth + Edge Functions) → Stripe (Payments + Connect) → Resend (Emails)",
        conceptualNote:
          "Architecture based on stated tech stack. No internal architecture diagram uploaded.",
      },
      {
        id: "funck-ticket-fsm",
        title: "Ticket Lifecycle State Machine",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description:
          "UNPAID → PAID → ISSUED (QR generated) → SCANNED (at door) → LOCKED (fraud prevention, no re-scan)",
        conceptualNote:
          "State machine inferred from feature description. Actual implementation may differ.",
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
    period: "TODO: Add dates",
    bullets: [
      {
        text: "Improved validation and packaging workflow from ~20 min to ~10–12 min",
        confidence: "CONCEPTUAL",
        evidence_source: "Observed estimate (formal metrics pending)",
      },
      {
        text: "TODO: Add additional responsibilities and achievements",
        confidence: "CONCEPTUAL",
      },
    ],
  },
  {
    company: "CVS Pharmacy",
    role: "Pharmacy Technician",
    location: "Dublin, CA",
    period: "June 2023 – June 2024",
    bullets: [
      {
        text: "California state certified pharmacy technician",
        confidence: "VERIFIED",
      },
      {
        text: "TODO: Add specific responsibilities",
        confidence: "CONCEPTUAL",
      },
    ],
  },
];

// ========== SKILLS ==========

export const skills = {
  core: [
    "Systems Thinking",
    "Test & Validation Mindset",
    "Technical Documentation",
    "Customer Service",
  ],
  technical: [
    { name: "SystemVerilog / HDL", evidence: "OTTER CPU project (CPE 233)", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Analog Circuit Design", evidence: "EE 241 Labs 1-7", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Manual Machining (Lathe & Mill)", evidence: "IME 144 Air Motor project", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "GD&T / Engineering Drawings", evidence: "IME 144 Manual", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "CAD / Hand Drafting", evidence: "IME 144 coursework", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "RISC-V Assembly", evidence: "RISC-V_Assembler_Manual.pdf", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "LTSpice Simulation", evidence: "EE 241 Lab 6", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Web Development (React/TypeScript)", evidence: "Funck platform (funck.live)", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "MATLAB", evidence: "TODO: Provide coursework evidence", confidence: "CONCEPTUAL" as ConfidenceBadge },
    { name: "Python", evidence: "TODO: Provide coursework evidence", confidence: "CONCEPTUAL" as ConfidenceBadge },
    { name: "Soldering & Prototyping", evidence: "EE 241 lab work", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Oscilloscope / Function Generator", evidence: "EE 241 lab equipment usage", confidence: "VERIFIED" as ConfidenceBadge },
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
    "Boy Scouts — 16 years",
    "Previously CPR/First Aid certified; open to recertification (not currently certified)",
  ],
};
