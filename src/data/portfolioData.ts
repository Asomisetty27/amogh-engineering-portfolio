// ========== PORTFOLIO DATA MODEL ==========
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
  engineeringNote?: boolean;
}

export interface FailureMode {
  problem: string;
  cause: string;
  fix: string;
  systemImpact: string;
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

export interface RGMStage {
  number: number;
  name: string;
  labSource: string;
  whatItDoes: string;
  howItWorks: string;
  input: string;
  output: string;
  evidenceSource: string;
  keyComponents?: string[];
}

export interface ProjectModule {
  missionObjective: string;
  systemArchitecture: string;
  implementationNotes: string[];
  failureModes: FailureMode[];
  improvements: string[];
  verificationSummary?: VerificationRow[];
  ownershipDisclosure?: { owned: string[]; aiAssisted: string[] };
  rgmStages?: RGMStage[];
  achievements?: string[];
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
  archived?: boolean;
  heroSummary: string;
  heroImage?: string;
  has3D?: boolean;
  hologramType?: "physical" | "system" | "network" | "interactive";
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

// ========== RGM STAGES (from Lab_Final_Report_Amogh_Somisetty.pdf) ==========
const rgmStages: RGMStage[] = [
  {
    number: 1,
    name: "Capacitive Touch Arduino Piano",
    labSource: "Lab 4",
    whatItDoes: "Input trigger for the entire RGM. User inputs correct 5-note sequence (keys 1, 3, 2, 4, 1) using four copper foil touch pads connected to Arduino Mega.",
    howItWorks: "Each pad uses RC circuit with 2.2 MΩ resistor. Touch increases capacitance beyond 1000 counts (CapacitiveSensor library). Unique tones (C4, D4, E4, F4) play via buzzer. After correct 5-note sequence, relay on pin 8 activates.",
    input: "Human touch — correct 5-note sequence",
    output: "Relay activation (pin 8 HIGH)",
    evidenceSource: "Lab_Final_Report, p3",
    keyComponents: ["Arduino Mega", "Copper foil pads", "2.2 MΩ resistors", "Buzzer", "CapacitiveSensor library"],
  },
  {
    number: 2,
    name: "Relay — Piano to Strobe Light",
    labSource: "Labs 2 & 4",
    whatItDoes: "Provides electrical isolation between the 5V Arduino and the 9V strobe light circuit.",
    howItWorks: "Arduino switches relay via BC548 NPN transistor. Relay closes normally-open contacts to connect 9V supply to strobe circuit. Flyback diode protects transistor from relay coil voltage spikes.",
    input: "Relay activation signal from piano Arduino",
    output: "9V power connected to strobe light circuit",
    evidenceSource: "Lab_Final_Report, p3",
    keyComponents: ["BC548 NPN transistor", "Relay module", "Flyback diode", "9V supply"],
  },
  {
    number: 3,
    name: "Strobe Light",
    labSource: "Lab 5",
    whatItDoes: "Produces bright flash to trigger light detector circuit.",
    howItWorks: "Three parts: (1) RC oscillator with Q1/Q2 transistors drives step-up transformer generating ~580V, (2) rectifier/capacitor stores high voltage, (3) SCR trigger circuit discharges energy into xenon flash tube. Flash rate = R3 × C3.",
    input: "9V from relay",
    output: "Bright xenon flash",
    evidenceSource: "Lab_Final_Report, p3",
    keyComponents: ["Step-up transformer", "Xenon flash tube", "SCR trigger", "RC oscillator (~580V)"],
  },
  {
    number: 4,
    name: "Light Detector with Schmitt Trigger",
    labSource: "Lab 2",
    whatItDoes: "Detects the strobe flash and outputs a clean digital signal to trigger the solenoid.",
    howItWorks: "Photoresistor and VR1 form voltage divider. Strobe flash causes V2 > V1 at Schmitt trigger input. Hysteresis prevents oscillation from ambient light. Output drives solenoid circuit.",
    input: "Strobe light flash",
    output: "Digital trigger signal to solenoid",
    evidenceSource: "Lab_Final_Report, p3–4",
    keyComponents: ["Photoresistor", "LM324 Op-Amp", "Schmitt trigger", "VR1 threshold pot"],
  },
  {
    number: 5,
    name: "Solenoid — Launches Steel Marble",
    labSource: "Lab 7",
    whatItDoes: "Physically launches steel marble into metal detector coil when triggered by light detector.",
    howItWorks: "Current through solenoid coil attracts inner plunger, pushing steel ball down track into inductor coil. Solenoid secured in track piece (6 in × 2 in × 1 in, 0.75 in cylindrical cutout).",
    input: "Trigger signal from light detector",
    output: "Steel marble launched into inductor coil",
    evidenceSource: "Lab_Final_Report, p4",
    keyComponents: ["Solenoid actuator", "Custom track (6×2×1 in)", "Steel marble"],
  },
  {
    number: 6,
    name: "555 Timer Metal Detector",
    labSource: "Lab 6",
    whatItDoes: "Senses steel marble inside inductor coil via frequency drop, signals Arduino to release electromagnet.",
    howItWorks: "NE555 in astable mode with LC oscillator. Without metal: 8,760 Hz. With marble: 8,310 Hz (5.1% drop, above 4% minimum). Arduino on pin 12 reads frequency with pulseIn() and sets electromagnet LOW when ≥4% drop detected.",
    input: "Steel marble enters inductor coil",
    output: "Frequency drop detection → Arduino signal",
    evidenceSource: "Lab_Final_Report, p4",
    keyComponents: ["NE555 timer", "LC oscillator", "Arduino Mega (pulseIn)", "Inductor coil"],
  },
  {
    number: 7,
    name: "Electromagnet Turns OFF — Ball Released",
    labSource: "Lab 7",
    whatItDoes: "Holds steel ball above tilt switch. Releases when metal detection confirmed.",
    howItWorks: "MOSFET on Arduino pin 11 controls electromagnet current. Initially HIGH (holding ball). Arduino detects ≥4% frequency drop → sets pin 11 LOW → MOSFET switches off → electromagnet releases ball. Shared ground required between Arduino and 9V supply.",
    input: "Arduino detection signal (≥4% frequency drop)",
    output: "Steel ball released from electromagnet",
    evidenceSource: "Lab_Final_Report, p4",
    keyComponents: ["MOSFET (N-Ch)", "Electromagnet", "Arduino pin 11", "Shared ground"],
  },
  {
    number: 8,
    name: "Metal Ball Drops onto Tilt Switch",
    labSource: "N/A",
    whatItDoes: "Steel ball falls under gravity onto tilt switch, physically actuating it.",
    howItWorks: "Tilt switch is normally open. Steel ball falls and tilts switch beyond threshold, closing circuit and sending signal to Arduino to update LCD.",
    input: "Steel ball released from electromagnet",
    output: "Tilt switch closed → Arduino digital input LOW",
    evidenceSource: "Lab_Final_Report, p5",
    keyComponents: ["Tilt switch (SPST, N.O.)", "Gravity"],
  },
  {
    number: 9,
    name: "LCD Displays 2 Rows of 16 White Blocks",
    labSource: "Last Step (Team Designed)",
    whatItDoes: "Displays confirmation — 2 rows of 16 white blocks each — completing the RGM sequence.",
    howItWorks: "Tilt switch connected to Arduino with INPUT_PULLUP. Default HIGH, switch closure pulls LOW. Arduino polls pin state, writes custom 0xFF block character to all 32 positions of I2C LCD (address 0x27). Clear visual confirmation of successful RGM completion.",
    input: "Tilt switch LOW signal",
    output: "LCD shows 2×16 white blocks (RGM complete)",
    evidenceSource: "Lab_Final_Report, p5–6",
    keyComponents: ["Arduino Mega", "Inland 16×2 I2C LCD (PCF8574)", "INPUT_PULLUP", "Custom block char"],
  },
];

// ========== RGM FAILURE MODES (from Lab_Final_Report, Section 3) ==========
const rgmFailureModes: FailureMode[] = [
  {
    problem: "Strobe light not flashing",
    cause: "Broken transistor lead in oscillator stage of strobe PCB",
    fix: "Replaced transistor and verified correct orientation; oscillator resumed and strobe flashed",
    systemImpact: "Entire downstream chain (light detector → solenoid → detection → release) was blocked",
    evidence_source: "Lab_Final_Report, p10–11",
    confidence: "VERIFIED",
  },
  {
    problem: "Light detector triggered by ambient light",
    cause: "Photoresistor/VR1 voltage divider reference too low — room lighting exceeded threshold",
    fix: "Adjusted VR1 to raise threshold so only high-intensity strobe flash triggers Schmitt trigger",
    systemImpact: "False triggering caused premature solenoid activation without strobe input",
    evidence_source: "Lab_Final_Report, p11",
    confidence: "VERIFIED",
  },
  {
    problem: "Electromagnet releasing immediately after piano key press",
    cause: "Small frequency fluctuations in 555 oscillator falsely exceeded threshold before marble entered coil",
    fix: "Implemented streak counter (STREAK_N=5), added RELEASE_DELAY (600ms), adjusted TRIP_DELTA threshold",
    systemImpact: "Ball dropped before metal detection, breaking chain at stage 7",
    evidence_source: "Lab_Final_Report, p11",
    confidence: "VERIFIED",
  },
  {
    problem: "MOSFET not switching reliably",
    cause: "No common ground between Arduino (USB 5V) and external 9V supply — undefined gate-source voltage",
    fix: "Connected both grounds together; MOSFET functioned correctly afterward",
    systemImpact: "Electromagnet could not be controlled, preventing ball release",
    evidence_source: "Lab_Final_Report, p12",
    confidence: "VERIFIED",
  },
  {
    problem: "Metal detector threshold tuning issues",
    cause: "Baseline ~8,760 Hz → with marble ~8,310 Hz (5.1% drop). Percent change calculation was noisy",
    fix: "Used fixed TRIP_DELTA=150 Hz instead of percent calculation; eliminated false triggers while maintaining detection",
    systemImpact: "Inconsistent detection causing missed or false electromagnet releases",
    evidence_source: "Lab_Final_Report, p12",
    confidence: "VERIFIED",
  },
  {
    problem: "RC time constant discrepancy (Lab 4)",
    cause: "38.5% error in charging, 12.8% in discharging — due to oscilloscope cursor positioning, component tolerances, breadboard contact resistance",
    fix: "Changed resistor to 20 kΩ which decreased percent error; documented tolerance effects",
    systemImpact: "Affected timing accuracy of capacitive touch detection",
    evidence_source: "Lab_Final_Report, p12",
    confidence: "VERIFIED",
  },
];

// ========== PROJECTS ==========
export const projects: Project[] = [
  {
    id: "rgm-machine",
    name: "Rube Goldberg Machine: The Electronic Chain Reaction",
    codename: "RGM",
    category: "Systems",
    course: "EE 241",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Nine-stage electromechanical chain reaction integrating capacitive piano, strobe, light detector, solenoid, 555 metal detector, electromagnet, tilt switch, and LCD — all working in sequence for live demo.",
    heroImage: "/evidence/rgm-complete-setup.jpg",
    has3D: true,
    hologramType: "physical",
    module: {
      missionObjective:
        "Design and integrate a nine-stage Rube Goldberg Machine using circuits from EE 241 Labs 2–7, plus a team-designed final step. The RGM must execute a complete chain reaction from capacitive piano input to LCD output with no manual intervention after the initial trigger.",
      systemArchitecture:
        "Piano (capacitive touch) → Relay (5V→9V isolation) → Strobe (~580V flash) → Light Detector (Schmitt trigger) → Solenoid (marble launch) → 555 Metal Detector (8,760→8,310 Hz) → Electromagnet (MOSFET release) → Tilt Switch → LCD (2×16 white blocks). Arduino Mega controls detection, threshold logic, and LCD output.",
      implementationNotes: [
        "5-note capacitive sequence (1,3,2,4,1) with 2.2MΩ RC pads triggers relay",
        "BC548 NPN transistor switches relay; flyback diode protects from relay coil spikes",
        "Strobe generates ~580V via step-up transformer and RC oscillator",
        "Schmitt trigger with adjusted VR1 filters ambient light; only strobe flash triggers",
        "Solenoid launches marble from custom 6×2×1 in track into inductor coil",
        "NE555 astable LC oscillator: baseline 8,760 Hz → 8,310 Hz with metal (5.1% drop)",
        "Arduino pulseIn() on pin 12; STREAK_N=5, TRIP_DELTA=150 Hz, RELEASE_DELAY=600ms",
        "MOSFET on pin 11 controls electromagnet; shared ground required between Arduino and 9V",
        "Tilt switch with INPUT_PULLUP; default HIGH, closure to GND triggers LCD fill",
        "I2C LCD (0x27) fills all 32 positions with custom 0xFF block character",
      ],
      failureModes: rgmFailureModes,
      improvements: [
        "Add digital frequency counter for more precise threshold detection",
        "Implement PCB-based integration instead of breadboard for reliability",
        "Add timing measurement between stages for performance analysis",
        "Consider wireless monitoring of each stage status",
      ],
      verificationSummary: [
        { parameter: "Baseline Frequency", value: "8,760", unit: "Hz", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "Metal-Present Frequency", value: "8,310", unit: "Hz", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "Frequency Drop", value: "5.1", unit: "%", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "Min Required Drop", value: "4", unit: "%", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "TRIP_DELTA", value: "150", unit: "Hz", evidence_source: "Lab_Final_Report, p7 (code)", confidence: "VERIFIED" },
        { parameter: "BASE_FREQ", value: "8,600", unit: "Hz", evidence_source: "Lab_Final_Report, p7 (code)", confidence: "VERIFIED" },
        { parameter: "STREAK_N", value: "5", unit: "readings", evidence_source: "Lab_Final_Report, p7 (code)", confidence: "VERIFIED" },
        { parameter: "RELEASE_DELAY", value: "600", unit: "ms", evidence_source: "Lab_Final_Report, p7 (code)", confidence: "VERIFIED" },
        { parameter: "Strobe HV", value: "~580", unit: "V", evidence_source: "Lab_Final_Report, p3", confidence: "VERIFIED" },
        { parameter: "Total Stages", value: "9", unit: "stages", evidence_source: "Lab_Final_Report, p2", confidence: "VERIFIED" },
      ],
      rgmStages,
      achievements: [
        "Capacitive piano recognized proper 5-note sequence",
        "Relay successfully switched 9V power supply",
        "Strobe flashed in sequence",
        "Light detector only responded to strobe flash (not ambient)",
        "Solenoid successfully launched steel ball",
        "555 metal detector achieved 5.1% frequency change",
        "Electromagnet released only after confirmed detection",
        "Tilt switch triggered correctly (LOW with INPUT_PULLUP)",
        "LCD displayed 2 rows of 16 white blocks",
      ],
    },
    diagrams: [
      {
        id: "rgm-setup-photo",
        title: "Complete RGM Setup",
        confidence: "VERIFIED",
        derivedFrom: ["Lab_Final_Report_Amogh_Somisetty.pdf, p1"],
        description: "Complete RGM system as demonstrated in class on March 10, 2026.",
        imagePath: "/evidence/rgm-complete-setup.jpg",
      },
      {
        id: "rgm-block-diagram",
        title: "RGM Step-by-Step Block Diagram",
        confidence: "VERIFIED",
        derivedFrom: ["Lab_Final_Report_Amogh_Somisetty.pdf, p2"],
        description: "Nine-stage block diagram from Piano Key → LCD Display showing decision logic at frequency detection step.",
        imagePath: "/evidence/rgm-block-diagram.png",
      },
      {
        id: "rgm-last-step-schematic",
        title: "Last Step Schematic — Tilt Switch + I2C LCD",
        confidence: "VERIFIED",
        derivedFrom: ["Lab_Final_Report_Amogh_Somisetty.pdf, p6"],
        description: "Arduino digital input with INPUT_PULLUP, tilt switch SPST connection, Inland 16×2 LCD I2C backpack (PCF8574, address 0x27).",
        imagePath: "/evidence/rgm-last-step-schematic.png",
      },
    ],
    evidence: [
      {
        id: "rgm-report",
        fileName: "Lab_Final_Report_Amogh_Somisetty.pdf",
        type: "pdf",
        description: "EE 241-01 Final RGM Project Report (15 pages). All 9 stages, schematics, code, failure modes, and discussion.",
      },
      {
        id: "rgm-solenoid-cad",
        fileName: "Solenoid_Track_v2.f3d",
        type: "image",
        description: "Fusion 360 CAD file for solenoid track piece (6×2×1 in, 0.75 in cylindrical cutout). VERIFIED model file uploaded.",
      },
      {
        id: "rgm-light-detector-cad",
        fileName: "Light_detector_Somisetty_A_CA.f3d",
        type: "image",
        description: "Fusion 360 CAD file for light detector housing.",
      },
      {
        id: "rgm-arduino-cad",
        fileName: "Arduino_Uno_Model_1.f3d",
        type: "image",
        description: "Fusion 360 CAD model of Arduino board.",
      },
      {
        id: "rgm-pcb-cad",
        fileName: "Eagle_1_Inch_Square_PCB_Model.f3d",
        type: "image",
        description: "Fusion 360 CAD model of 1-inch square PCB.",
      },
    ],
    techStack: ["Arduino Mega", "555 Timer", "MOSFET", "Solenoid", "Electromagnet", "Schmitt Trigger", "I2C LCD", "Capacitive Touch"],
  },
  {
    id: "metal-detector",
    name: "RGM Stage: Metal Detection & Electromagnet Release",
    codename: "DETECT-7",
    category: "Hardware",
    course: "EE 241",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "555 timer LC oscillator detects steel marble via 5.1% frequency drop (8,760→8,310 Hz); MOSFET-controlled electromagnet releases retained ball on confirmed detection.",
    has3D: true,
    hologramType: "physical",
    module: {
      missionObjective:
        "Build the metal detection and electromagnet release subsystem (RGM Stages 6–7). 555 timer LC oscillator detects metal presence via frequency shift; MOSFET-controlled electromagnet releases ball when detection confirmed by Arduino streak logic.",
      systemArchitecture:
        "NE555 astable LC oscillator → Arduino pulseIn() frequency measurement → Streak counter (N=5) → TRIP_DELTA threshold (150 Hz) → RELEASE_DELAY (600ms) → MOSFET gate LOW → Electromagnet de-energizes → Ball released",
      implementationNotes: [
        "555 timer with L1=0.5mH inductor, C2/C3=2.2µF capacitors",
        "Baseline frequency: 8,760 Hz without metal",
        "Metal-present frequency: 8,310 Hz (5.1% drop > 4% minimum)",
        "Arduino reads frequency via pulseIn() on pin 12",
        "STREAK_N=5 consecutive readings required before release",
        "TRIP_DELTA=150 Hz fixed threshold (more reliable than percent calculation)",
        "RELEASE_DELAY=600ms debounce before electromagnet off",
        "MOSFET on pin 11 controls electromagnet; shared ground critical",
        "Flyback diode (1N4004/MUR348) protects MOSFET from back-EMF",
        "Electromagnet holding force: 2.5 kg (5V spec)",
      ],
      failureModes: [
        {
          problem: "Solenoid back-EMF damaging MOSFET",
          cause: "Inductive kickback from solenoid coil de-energization",
          fix: "Added 1N4004 flyback diode across solenoid coil",
          systemImpact: "MOSFET failure would prevent electromagnet control",
          evidence_source: "EE_241_Lab_7, p1",
          confidence: "VERIFIED",
        },
        {
          problem: "MOSFET not switching — no common ground",
          cause: "Arduino USB 5V and external 9V had separate grounds → undefined V_GS",
          fix: "Connected both grounds; MOSFET operated correctly",
          systemImpact: "Electromagnet could not be controlled at all",
          evidence_source: "Lab_Final_Report, p12",
          confidence: "VERIFIED",
        },
      ],
      improvements: [
        "Digital frequency counter for precise threshold detection",
        "Adjustable sensitivity via potentiometer on TRIP_DELTA",
        "Visual/audio indicator for detection events",
      ],
      verificationSummary: [
        { parameter: "Baseline Frequency", value: "8,760", unit: "Hz", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "Metal-Present Freq", value: "8,310", unit: "Hz", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "Frequency Drop", value: "5.1", unit: "%", evidence_source: "Lab_Final_Report, p4", confidence: "VERIFIED" },
        { parameter: "Inductor (L1)", value: "0.5", unit: "mH", evidence_source: "EE_241_Lab_6, schematic", confidence: "VERIFIED" },
        { parameter: "Capacitor (C2,C3)", value: "2.2", unit: "µF", evidence_source: "EE_241_Lab_6, schematic", confidence: "VERIFIED" },
        { parameter: "Supply Voltage", value: "9", unit: "VDC", evidence_source: "EE_241_Lab_6, schematic", confidence: "VERIFIED" },
        { parameter: "Electromagnet Hold", value: "2.5", unit: "kg", evidence_source: "EE_241_Lab_7, p1", confidence: "VERIFIED" },
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
        description: "TLC555 timer circuit with L1=0.5mH, C2/C3=2.2µF, R1=10K, R2=12K, R3=10K, R4=47K, C1=0.1µF, 9VDC supply.",
        imagePath: "/evidence/ee241-lab6-555timer.jpg",
      },
      {
        id: "lab7-drive-circuit",
        title: "Solenoid Drive Circuit (BJT)",
        confidence: "VERIFIED",
        derivedFrom: ["EE_241_Lab_7_Electric_Circuit_Analysis.pdf"],
        description: "BJT (TIP1E) drive circuit: base resistor (1K/2.2K), flyback diode (1N4004/MUR348), collector to solenoid, emitter to GND.",
        imagePath: "/evidence/ee241-lab7-drive-circuit.png",
      },
    ],
    evidence: [
      { id: "lab6-pdf", fileName: "EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf", type: "pdf", description: "Lab 6: 555 Timer Metal Detector schematic and RLC analysis.", path: "/evidence/ee241-lab6-555timer.jpg" },
      { id: "lab7-pdf", fileName: "EE_241_Lab_7_Electric_Circuit_Analysis.pdf", type: "pdf", description: "Lab 7: Solenoid & Electromagnet integration, drive circuit.", path: "/evidence/ee241-lab7-solenoid.jpg" },
      { id: "rgm-report-ref", fileName: "Lab_Final_Report_Amogh_Somisetty.pdf", type: "pdf", description: "Full RGM report with metal detector/electromagnet integration details and failure modes." },
    ],
    techStack: ["555 Timer", "MOSFET", "Arduino", "Electromagnet", "LC Oscillator", "Soldering"],
  },
  {
    id: "otter-cpu",
    name: "OTTER Multi-Cycle RISC-V CPU",
    codename: "OTTER",
    category: "Hardware",
    course: "CPE 233",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Multi-cycle RISC-V processor in SystemVerilog with full RV32I support, 10 ALU operations, dual-port memory, and FSM control unit.",
    has3D: true,
    hologramType: "interactive",
    module: {
      missionObjective:
        "Design and implement a multi-cycle RISC-V processor (OTTER MCU) in SystemVerilog, supporting the RV32I base instruction set with PC, register file, ALU, memory, immediate generation, branch logic, and FSM control unit.",
      systemArchitecture:
        "Multi-cycle datapath: PC (4 sources via pcSource MUX), IMEM, Register File (32×32), ALU (10 ops), Immediate Generator (I/S/B/U/J), Branch Condition Generator, CU_FSM + CU_DCDR, dual-port Memory, IOBUS interface.",
      implementationNotes: [
        "PC supports 4 sources: PC+4, jalr, branch, jal",
        "ALU: add, sub, and, or, xor, slt, sltu, sra, sll, lui-copy",
        "Branch Cond Gen: br_eq, br_lt, br_ltu → CU_DCDR",
        "RF: dual-read (rs1, rs2), single-write with rf_wr_sel MUX (PC+4, CSR_reg, DOUT2)",
        "Memory: dual-port (ADDR1=PC, ADDR2=ALU result), RDEN1, RDEN2, WE2, SIZE, SIGN",
        "FSM: FETCH → EXEC (2-cycle minimum)",
        "Immediate Gen: ir[31:7] → I, S, B, U, J types",
        "IOBUS: IO_IN, IO_WR, IOBUS_OUT, IOBUS_ADDR for peripherals",
      ],
      failureModes: [
        {
          problem: "Branch target miscalculation",
          cause: "pcSource MUX not properly gated by PCWrite signal",
          fix: "PCWrite only asserts during EXEC state; verified via BRANCH_ADDR_GEN module",
          systemImpact: "Incorrect program flow on branch instructions",
          evidence_source: "OTTER_Architecture_No_Interrupts_1.pdf, p1",
          confidence: "VERIFIED",
        },
      ],
      improvements: [
        "Add pipeline stages (IF/ID/EX/MEM/WB)",
        "Implement interrupt handling (INTR, CSR_reg path)",
        "Hazard detection and forwarding logic",
        "Expand to RV32IM (multiply/divide)",
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
        description: "Complete RISC-V OTTER MCU datapath showing all modules and signal paths.",
        imagePath: "/evidence/otter-datapath.jpg",
      },
    ],
    evidence: [
      { id: "otter-arch-pdf", fileName: "OTTER_Architecture_No_Interrupts_1.pdf", type: "pdf", description: "Full OTTER MCU architecture diagram with datapath, control unit, and ALU table", path: "/evidence/otter-datapath.jpg" },
      { id: "riscv-asm-manual", fileName: "RISC-V_Assembler_Manual.pdf", type: "pdf", description: "RISC-V OTTER Assembly Manual v4.04 — ISA formats, opcodes, instructions" },
    ],
    techStack: ["SystemVerilog", "Vivado", "RISC-V ISA", "FPGA"],
  },
  {
    id: "air-motor",
    name: "Pneumatic Air Motor — Manufacturing Skills",
    codename: "AERO-MFG",
    category: "Hardware",
    course: "IME 144",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Precision-machined pneumatic air motor: lathe, mill, GD&T, and production planning for 6 custom parts.",
    has3D: true,
    hologramType: "physical",
    module: {
      missionObjective:
        "Design and manufacture a functional pneumatic air motor through precision machining. Develop production planning, engineering drawings, GD&T, and hands-on fabrication skills.",
      systemArchitecture:
        "Air motor assembly: Crank Disk, Cylinder, Flywheel, Frame, Mainshaft, Piston. Manufactured using manual lathe and milling machines.",
      implementationNotes: [
        "Parts: Crank Disk, Cylinder, Flywheel, Frame, Mainshaft, Piston",
        "Processes: Turning (lathe), Milling, Sawing, Threading, Broaching",
        "Measuring: Calipers, Micrometers, Dial indicators, Gage blocks",
        "GD&T per ASME Y14.5 standard",
        "Feeds & speeds calculated per material and operation",
        "Production planning documents created for each part",
      ],
      failureModes: [],
      improvements: [
        "CNC machining for higher precision repeatability",
        "Alternative materials (aluminum alloys) for weight reduction",
      ],
    },
    diagrams: [
      {
        id: "ime144-cover-verified",
        title: "Air Motor Assembly Reference",
        confidence: "VERIFIED",
        derivedFrom: ["IME_144_MANUAL.pdf"],
        description: "Air motor assembly illustration from IME 144 course manual.",
        imagePath: "/evidence/ime144-cover.jpg",
      },
    ],
    evidence: [
      { id: "ime144-manual", fileName: "IME_144_MANUAL.pdf", type: "pdf", description: "Full IME 144 Manual: engineering drawings, GD&T, machining processes, air motor project (pp.224-285).", path: "/evidence/ime144-cover.jpg" },
      { id: "ime144-crank", fileName: "Crank_Disk-2.SLDPRT", type: "image", description: "SolidWorks part file for Crank Disk" },
      { id: "ime144-cylinder", fileName: "Cylinder.SLDPRT", type: "image", description: "SolidWorks part file for Cylinder" },
      { id: "ime144-mill", fileName: "IME_144_Mill_Part_1_Somisetty.SLDPRT", type: "image", description: "SolidWorks part file for milled component" },
      { id: "ime144-screwdriver", fileName: "IME_Screwdriver_Project_Somisetty.SLDPRT", type: "image", description: "SolidWorks screwdriver project file" },
    ],
    techStack: ["Manual Lathe", "Manual Mill", "GD&T", "SolidWorks", "Metrology", "Production Planning"],
  },
  {
    id: "funck",
    name: "Funck — Event Ticketing Platform",
    codename: "FUNCK",
    category: "Web",
    status: "ACTIVE",
    statusColor: "neon-cyan",
    heroSummary: "Live event ticketing platform with QR tickets, Stripe payments, fraud prevention, and demand-based pricing.",
    has3D: true,
    hologramType: "network",
    module: {
      missionObjective:
        "Build and operate a live event ticketing platform with presale tickets, QR code issuance, fraud prevention, demand-based pricing, Stripe Connect payouts, group split-pay, and analytics.",
      systemArchitecture:
        "Client (React) → Lovable App → Supabase (PostgreSQL + Auth + Edge Functions) → Stripe (payments + Connect payouts) → Resend (email delivery). QR ticket lifecycle managed server-side.",
      implementationNotes: [
        "Built using Lovable, Supabase, Stripe, Resend",
        "Live at www.funck.live",
        "Presale tickets, QR ticket issuance, fraud prevention at door scan",
        "Demand-based pricing logic",
        "Stripe Connect for organizer payouts",
        "Group split-pay functionality",
        "Analytics and logging dashboard",
      ],
      failureModes: [],
      improvements: [
        "Concurrency controls for ticket purchase race conditions",
        "Idempotency keys for Stripe payment intents",
        "Rate limiting on ticket scan endpoint",
        "Load testing for high-demand events",
      ],
      ownershipDisclosure: {
        owned: [
          "Product requirements and feature scoping",
          "User flow and product decisions",
          "Integration architecture (Stripe Connect, Supabase, Resend)",
          "Testing and QA across payment flows",
          "Deployment and production operations",
          "Validation and user feedback iteration",
        ],
        aiAssisted: [
          "Code generation via Lovable AI — used for implementation acceleration",
        ],
      },
    },
    diagrams: [
      {
        id: "funck-arch",
        title: "Platform Architecture",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description: "Client (React/Lovable) → Supabase (DB + Auth + Edge Functions) → Stripe (Payments + Connect) → Resend (Emails)",
        conceptualNote: "Architecture based on stated tech stack. Reflects actual production system at funck.live.",
      },
      {
        id: "funck-ticket-fsm",
        title: "Ticket Lifecycle State Machine",
        confidence: "CONCEPTUAL",
        derivedFrom: [],
        description: "UNPAID → PAID → ISSUED (QR) → SCANNED (door) → LOCKED (fraud prevention)",
        conceptualNote: "State machine reflects designed ticket flow.",
        engineeringNote: true,
      },
    ],
    evidence: [
      { id: "funck-live", fileName: "www.funck.live", type: "link", description: "Live production URL", url: "https://www.funck.live" },
    ],
    techStack: ["React", "Lovable", "Supabase", "Stripe", "Resend", "TypeScript"],
  },
];

// ========== EXPERIENCE ==========
export const experiences: ExperienceItem[] = [
  {
    company: "Natera",
    role: "Intern",
    location: "Pleasanton, CA",
    period: "Summer 2024",
    bullets: [
      { text: "Improved validation and packaging workflow from ~20 min to ~10–12 min through bottleneck removal and workflow standardization", confidence: "CONCEPTUAL", evidence_source: "Observed estimate — formal time study pending" },
      { text: "Identified and removed redundant verification steps that did not affect quality outcomes", confidence: "CONCEPTUAL", evidence_source: "Observed estimate" },
      { text: "Documented standardized packaging procedures for team reference", confidence: "CONCEPTUAL", evidence_source: "Observed estimate" },
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
      { text: "California state certified pharmacy technician — processed prescriptions, managed inventory, customer consultations", confidence: "VERIFIED" },
      { text: "High-volume prescription fulfillment with attention to accuracy and regulatory compliance", confidence: "VERIFIED" },
    ],
  },
];

// ========== SKILLS ==========
export const skills = {
  core: ["Systems Thinking", "Test & Validation Mindset", "Technical Documentation", "Customer Service"],
  technical: [
    { name: "SystemVerilog / HDL", evidence: "OTTER CPU project (CPE 233)", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Analog Circuit Design", evidence: "EE 241 Labs 1-7 + RGM", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Manual Machining (Lathe & Mill)", evidence: "IME 144 Air Motor", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "GD&T / Engineering Drawings", evidence: "IME 144 Manual", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "CAD (SolidWorks, Fusion 360)", evidence: "IME 144 + RGM CAD files", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "RISC-V Assembly", evidence: "RISC-V_Assembler_Manual.pdf", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Arduino / Embedded C++", evidence: "RGM Final Report (Arduino Mega)", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "LTSpice Simulation", evidence: "EE 241 Lab 6", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Web Development (React/TS)", evidence: "Funck platform (funck.live)", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Soldering & Prototyping", evidence: "EE 241 lab work + RGM", confidence: "VERIFIED" as ConfidenceBadge },
    { name: "Test Equipment (Scope/FGen)", evidence: "EE 241 lab equipment", confidence: "VERIFIED" as ConfidenceBadge },
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
    "\"I'm Amogh, EE student at Cal Poly SLO. I build things that work — from RISC-V CPUs to nine-stage chain-reaction machines to live ticketing platforms.\"",
    "Show: RGM hero photo → \"Built a 9-stage Rube Goldberg Machine integrating capacitive touch, strobe, metal detection, and electromagnet release — all working for live demo.\"",
    "Show: OTTER datapath → \"Designed a multi-cycle RISC-V processor with 10 ALU operations and dual-port memory.\"",
    "Show: Funck → \"Shipped a live ticketing platform with Stripe payments, QR tickets, and fraud prevention at funck.live.\"",
  ],
  threeMinute: [
    "Start with 1-minute pitch.",
    "RGM deep dive: Walk through 9-stage flow diagram. Highlight metal detector (8,760→8,310 Hz, 5.1% drop). Show 6 failure modes with root causes and fixes.",
    "OTTER: Walk through datapath — PC source MUX, ALU function select, branch condition generation, FETCH→EXEC FSM.",
    "Funck: Ownership — requirements, integration architecture, testing, deployment. AI assisted code generation only.",
    "Natera: ~40% time reduction through bottleneck removal (observed estimate).",
  ],
  tenMinute: [
    "Follow 3-minute structure with additions:",
    "RGM: Discuss each of 6 failure modes in detail — strobe transistor, ambient light, premature release, MOSFET ground, threshold tuning, RC discrepancy. Show Arduino code for streak counter and frequency detection.",
    "OTTER: ALU operations table, immediate generation for I/S/B/U/J types, branch target calculation, PCWrite gating.",
    "Metal Detector stage: 555 astable mode, LC oscillation, inductance shift, BJT vs MOSFET drive circuit, flyback diode, B = μ₀μᵣ(N/l)I.",
    "Air Motor: Manufacturing snapshot — lathe/mill ops, GD&T, production planning for 6 parts. Show CAD files.",
    "Funck: Ticket lifecycle, engineering TODOs (concurrency, idempotency, rate limiting). Show live demo.",
    "Skills: Systems thinking thread across hardware, analog, manufacturing, and software.",
  ],
};
