// ========== PORTFOLIO DATA MODEL ==========
export type ConfidenceBadge = "VERIFIED" | "CONCEPTUAL";

export interface EvidenceItem {
  id: string;
  fileName: string;
  page?: number;
  type: "pdf" | "image" | "screenshot" | "code" | "link" | "video";
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

export interface Subsystem {
  id: string;
  title: string;
  description: string;
  details: string[];
  confidence: ConfidenceBadge;
  evidenceSource?: string;
}

export interface ProjectModule {
  problemStatement: string;
  systemOverview: string;
  systemArchitecture: string;
  subsystems?: Subsystem[];
  implementationNotes: string[];
  failureModes: FailureMode[];
  improvements: string[];
  validationResults?: string[];
  keyInsight?: string;
  verificationSummary?: VerificationRow[];
  ownershipDisclosure?: { owned: string[]; aiAssisted: string[] };
  rgmStages?: RGMStage[];
  achievements?: string[];
}

export type SystemDomain =
  | "signal-systems"
  | "electromechanical"
  | "digital-systems"
  | "manufacturing"
  | "materials";

export type ProjectStatus = "COMPLETE" | "IN_PROGRESS" | "EVIDENCE_PENDING" | "ACTIVE";

export interface Project {
  id: string;
  name: string;
  codename: string;
  domain: SystemDomain;
  status: ProjectStatus;
  course?: string;
  statusColor: string;
  module: ProjectModule;
  diagrams: DiagramItem[];
  evidence: EvidenceItem[];
  techStack: string[];
  heroSummary: string;
  heroImage?: string;
  has3D?: boolean;
  hologramType?: "physical" | "system" | "network" | "interactive" | "scientific";
  videoPath?: string;
}

export interface SystemDomainInfo {
  id: SystemDomain;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
}

export const systemDomains: SystemDomainInfo[] = [
  {
    id: "signal-systems",
    name: "System Integration & Signal Pipelines",
    subtitle: "End-to-end analog↔digital systems, signal conditioning, ADC/DAC",
    icon: "signal",
    color: "neon-cyan",
  },
  {
    id: "electromechanical",
    name: "Electromechanical Systems",
    subtitle: "Multi-stage chain reactions, sensors, actuators, control loops",
    icon: "zap",
    color: "neon-green",
  },
  {
    id: "digital-systems",
    name: "Digital Systems & Computation",
    subtitle: "CPU architecture, FSMs, FPGA implementation, HDL design",
    icon: "cpu",
    color: "neon-magenta",
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Physical Realization",
    subtitle: "CAD → fabrication → assembly, GD&T, machining, PCB",
    icon: "wrench",
    color: "neon-amber",
  },
  {
    id: "materials",
    name: "Materials Engineering & Material Selection",
    subtitle: "Structure–property–processing reasoning, phase transformations, degradation",
    icon: "flask",
    color: "neon-magenta",
  },
];

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
  // ===== DOMAIN: SIGNAL SYSTEMS =====
  {
    id: "ee143-signal-system",
    name: "End-to-End Analog ↔ Digital Signal System",
    codename: "EE143-SYS",
    domain: "signal-systems",
    course: "EE 143",
    status: "EVIDENCE_PENDING",
    statusColor: "neon-amber",
    heroSummary: "Full signal pipeline: analog input → op-amp conditioning → Arduino ADC → 4-bit digital processing → binary-weighted DAC → analog output. 16 discrete voltage levels, ~62.5 mV resolution.",
    has3D: false,
    hologramType: "system",
    module: {
      problemStatement: "How do you convert an analog signal to digital, process it, and reconstruct it — understanding every loss and distortion introduced at each stage?",
      systemOverview: "Complete analog-to-digital-to-analog pipeline spanning measurement, conditioning, conversion, processing, and reconstruction. Built across EE 143 labs culminating in a working ADC→DAC system.",
      systemArchitecture: "Signal Source → Op-Amp Conditioning (level shift, buffer) → Arduino ADC (10-bit, mapped to 4-bit) → Digital Processing → 4-bit Binary Weighted DAC → Output Stage → Speaker",
      subsystems: [
        {
          id: "measurement",
          title: "Measurement & Instrumentation",
          description: "Oscilloscope triggering, waveform measurement, frequency/time domain analysis, function generator behavior (50Ω vs Hi-Z loading)",
          details: [
            "Oscilloscope trigger modes: edge, auto, single",
            "Function generator 50Ω output impedance vs Hi-Z termination effects",
            "Frequency measurement: period method vs frequency counter",
            "Rise/fall time measurement techniques",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "EE 143 labs — evidence upload pending",
        },
        {
          id: "analog-conditioning",
          title: "Analog Conditioning (Op-Amp Systems)",
          description: "Summing amplifier for audio level shifting, voltage follower for buffering, practical current source design",
          details: [
            "Summing amplifier: shifts AC signal into ADC-compatible 0–5V range",
            "Voltage follower: unity gain buffer prevents loading from ADC input impedance",
            "Current source: provides stable bias for sensor circuits",
            "Op-amp non-idealities: input offset voltage, slew rate, CMRR effects",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "EE 143 labs — evidence upload pending",
        },
        {
          id: "pcb-dac",
          title: "PCB Design & 4-bit DAC",
          description: "Binary-weighted resistor DAC: LTSpice simulation → Fusion 360 PCB design → physical board via reflow soldering",
          details: [
            "4-bit binary weighted DAC: R, 2R, 4R, 8R resistor network",
            "16 discrete output levels from 4 digital input bits",
            "~62.5 mV resolution (5V / 2⁴ = 312.5 mV per step, output dependent on weighting)",
            "LTSpice simulation verified step response before fabrication",
            "Eagle/Fusion PCB layout with proper trace routing",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "EE 143 labs — evidence upload pending",
        },
        {
          id: "hardware-assembly",
          title: "Hardware Assembly & Manufacturing",
          description: "Reflow soldering process, thermal profile stages, manual vs reflow comparison",
          details: [
            "Reflow soldering: preheat → soak → reflow → cooling stages",
            "Solder paste application via stencil",
            "Component placement and alignment",
            "Manual soldering for through-hole components",
            "Failure modes: tombstoning, bridging, cold joints",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "EE 143 labs — evidence upload pending",
        },
        {
          id: "system-integration",
          title: "System Integration — ADC→DAC Pipeline",
          description: "Arduino ADC sampling → 4-bit quantization → DAC reconstruction with staircase output and quantization error analysis",
          details: [
            "Arduino 10-bit ADC (0–1023) mapped to 4-bit (0–15)",
            "Quantization: continuous signal → 16 discrete levels",
            "Staircase waveform output from DAC",
            "Quantization error = ±½ LSB = ±31.25 mV",
            "Audio distortion audible due to low bit-depth",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "EE 143 labs — evidence upload pending",
        },
      ],
      implementationNotes: [
        "Full pipeline: analog signal → level shifting → ADC → 4-bit quantization → DAC → analog output",
        "Op-amp conditioning stage shifts signal into ADC-compatible range",
        "Arduino samples at 10-bit resolution, maps to 4-bit for DAC",
        "Binary-weighted DAC produces 16 discrete voltage levels",
        "Staircase output waveform demonstrates quantization effects",
        "Audio output through speaker shows distortion from low bit-depth",
      ],
      failureModes: [
        {
          problem: "Loading effects on signal source",
          cause: "ADC input impedance drawing current from signal source, causing voltage drop",
          fix: "Added voltage follower (unity gain buffer) between source and ADC",
          systemImpact: "Measured voltage did not match source voltage without buffer",
          confidence: "CONCEPTUAL",
        },
        {
          problem: "Signal clipping at ADC input",
          cause: "Input signal exceeding 0–5V ADC range after level shifting",
          fix: "Adjusted summing amplifier gain and offset to keep signal within range",
          systemImpact: "Clipped peaks caused distortion in reconstructed output",
          confidence: "CONCEPTUAL",
        },
        {
          problem: "Quantization distortion in audio output",
          cause: "4-bit resolution provides only 16 levels — insufficient for clean audio reproduction",
          fix: "Expected behavior at this bit-depth; documented as fundamental limitation of low-resolution conversion",
          systemImpact: "Audible staircase artifacts in speaker output",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Increase to 8-bit or 12-bit DAC for significantly reduced quantization noise",
        "Add anti-aliasing filter before ADC input",
        "Add reconstruction filter (low-pass) after DAC output",
        "Implement higher sampling rate for better audio fidelity",
      ],
      keyInsight: "Low bit-depth causes audible distortion because the continuous analog signal is approximated by only 16 discrete levels. Each conversion stage (analog→digital→analog) introduces quantization error. Analog systems behave non-ideally due to loading, offset voltages, and component tolerances — understanding these is essential for system-level design.",
    },
    diagrams: [],
    evidence: [],
    techStack: ["Op-Amps", "Arduino ADC", "Binary-Weighted DAC", "LTSpice", "PCB Design", "Reflow Soldering", "Oscilloscope"],
  },

  // ===== DOMAIN: ELECTROMECHANICAL =====
  {
    id: "rgm-machine",
    name: "Rube Goldberg Electromechanical System",
    codename: "RGM-9",
    domain: "electromechanical",
    course: "EE 241",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Nine-stage electromechanical chain reaction: capacitive piano → relay → strobe → light detector → solenoid → 555 metal detector → electromagnet → tilt switch → LCD. All 9 stages verified in live demo.",
    heroImage: "/evidence/rgm-complete-setup.jpg",
    videoPath: "/evidence/rgm-demo.mp4",
    has3D: true,
    hologramType: "physical",
    module: {
      problemStatement: "Design a nine-stage Rube Goldberg Machine where each stage must reliably trigger the next with no manual intervention. Any single failure breaks the entire chain.",
      systemOverview: "Nine-stage electromechanical chain reaction integrating circuits from EE 241 Labs 2–7 plus a team-designed final step. The system spans capacitive sensing, power switching, high-voltage generation, optical detection, electromagnetic actuation, frequency-based metal detection, and digital I/O — all sequentially dependent.",
      systemArchitecture: "Piano (capacitive touch) → Relay (5V→9V isolation) → Strobe (~580V flash) → Light Detector (Schmitt trigger) → Solenoid (marble launch) → 555 Metal Detector (8,760→8,310 Hz) → Electromagnet (MOSFET release) → Tilt Switch → LCD (2×16 white blocks)",
      subsystems: [
        {
          id: "capacitive-input",
          title: "Capacitive Input Detection",
          description: "Four copper foil touch pads with RC circuits detect finger touch via capacitance change exceeding 1000 counts",
          details: [
            "2.2 MΩ resistors create RC time constant",
            "CapacitiveSensor library measures charge time",
            "5-note sequence validation (1, 3, 2, 4, 1)",
            "Buzzer feedback: C4, D4, E4, F4 tones",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_Final_Report, p3",
        },
        {
          id: "light-sensing",
          title: "Light Sensing + Schmitt Trigger",
          description: "Photoresistor voltage divider with hysteresis-based Schmitt trigger discriminates strobe flash from ambient light",
          details: [
            "Photoresistor + VR1 voltage divider sets threshold",
            "LM324 op-amp comparator with hysteresis",
            "VR1 adjusted to reject room lighting",
            "Clean digital output for solenoid trigger",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_Final_Report, p3-4",
        },
        {
          id: "solenoid-actuation",
          title: "Solenoid Actuation",
          description: "Electromagnetic solenoid launches steel marble from custom track into inductor coil",
          details: [
            "Custom track: 6×2×1 in with 0.75 in cylindrical cutout",
            "Solenoid plunger pushes steel ball",
            "BJT drive circuit with flyback diode protection",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_Final_Report, p4",
        },
        {
          id: "metal-detection",
          title: "Metal Detection via Frequency Shift",
          description: "NE555 LC oscillator baseline 8,760 Hz drops to 8,310 Hz (5.1%) when steel marble enters coil",
          details: [
            "NE555 astable mode with L1=0.5mH, C2/C3=2.2µF",
            "Baseline: 8,760 Hz → Metal-present: 8,310 Hz",
            "5.1% drop exceeds 4% minimum threshold",
            "Arduino pulseIn() on pin 12 measures frequency",
            "STREAK_N=5 consecutive readings required",
            "TRIP_DELTA=150 Hz fixed threshold",
            "RELEASE_DELAY=600ms debounce",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_Final_Report, p4",
        },
        {
          id: "electromagnet-release",
          title: "Electromagnet Release",
          description: "MOSFET-controlled electromagnet holds ball; releases on confirmed frequency drop detection",
          details: [
            "N-channel MOSFET on Arduino pin 11",
            "Initially HIGH (holding ball)",
            "Arduino sets LOW after streak confirmation",
            "Shared ground critical between Arduino and 9V",
            "Flyback diode protects MOSFET from back-EMF",
            "Holding force: 2.5 kg at 5V",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_Final_Report, p4",
        },
      ],
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
        "Digital frequency counter for more precise threshold detection",
        "PCB-based integration instead of breadboard for reliability",
        "Timing measurement between stages for performance analysis",
        "Wireless monitoring of each stage status",
      ],
      validationResults: [
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
        "Capacitive piano successfully recognized the proper sequence of 5 notes",
        "Relay successfully switched 9V power supply",
        "Strobe successfully flashed in sequence",
        "Light detector only responded to strobe flash",
        "Solenoid successfully launched steel ball",
        "555 metal detector achieved 5.1% frequency change",
        "Electromagnet only released after confirmed detection",
        "Tilt switch triggered correctly (LOW with INPUT_PULLUP)",
        "LCD displayed 2 rows of 16 white blocks",
      ],
      keyInsight: "Each stage must correctly produce an output that triggers the next. A single failure anywhere in the chain halts the entire system. Debugging required understanding signal propagation across domain boundaries — capacitive, optical, mechanical, electromagnetic, and digital.",
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
      {
        id: "rgm-report",
        fileName: "Lab_Final_Report_Amogh_Somisetty.pdf",
        type: "pdf",
        description: "EE 241-01 Final RGM Project Report (15 pages). All 9 stages, schematics, code, failure modes, and discussion.",
      },
      {
        id: "rgm-demo-video",
        fileName: "EE_241_Final_Demonstration.mp4",
        type: "video",
        description: "Video demonstration of all nine RGM stages operating in sequence during class demo on March 10, 2026.",
        path: "/evidence/rgm-demo.mp4",
      },
      {
        id: "rgm-solenoid-cad",
        fileName: "Solenoid_Track_v2.f3d",
        type: "image",
        description: "Fusion 360 CAD file for solenoid track piece (6×2×1 in, 0.75 in cylindrical cutout).",
      },
      {
        id: "rgm-light-detector-cad",
        fileName: "Light_detector_Somisetty_A_CA.f3d",
        type: "image",
        description: "Fusion 360 CAD file for light detector housing.",
      },
    ],
    techStack: ["Arduino Mega", "555 Timer", "MOSFET", "Solenoid", "Electromagnet", "Schmitt Trigger", "I2C LCD", "Capacitive Touch", "Op-Amps"],
  },

  // ===== DOMAIN: DIGITAL SYSTEMS =====
  {
    id: "digital-systems",
    name: "Digital Systems — FPGA & CPU Architecture",
    codename: "DIGI-SYS",
    domain: "digital-systems",
    course: "CPE 233 / CPE 133",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Multi-cycle RISC-V CPU (OTTER MCU) with full RV32I support, 10 ALU operations, FSM control, and FPGA-based digital systems including state machines and sequential logic.",
    has3D: true,
    hologramType: "interactive",
    module: {
      problemStatement: "How do you design a complete CPU from gates up — implementing instruction fetch, decode, execute, and memory access cycles with correct timing and control?",
      systemOverview: "Comprehensive digital systems work spanning CPU architecture (OTTER MCU in SystemVerilog), finite state machines, and FPGA implementation of combinational and sequential logic.",
      systemArchitecture: "OTTER MCU: PC → IMEM → Decode → RF(32×32) → ALU(10 ops) → Memory → Writeback. CU_FSM: FETCH→EXEC. Branch logic: br_eq, br_lt, br_ltu. Immediate Gen: I/S/B/U/J types.",
      subsystems: [
        {
          id: "otter-cpu",
          title: "OTTER Multi-Cycle RISC-V CPU",
          description: "Complete RV32I processor with multi-cycle datapath, FSM control unit, and dual-port memory",
          details: [
            "PC supports 4 sources: PC+4, jalr, branch, jal",
            "ALU: add, sub, and, or, xor, slt, sltu, sra, sll, lui-copy",
            "Branch Condition Generator: br_eq, br_lt, br_ltu → CU_DCDR",
            "Register File: 32×32 dual-read, single-write with rf_wr_sel MUX",
            "Memory: dual-port (ADDR1=PC, ADDR2=ALU), RDEN1/2, WE2, SIZE, SIGN",
            "FSM: FETCH → EXEC (2-cycle minimum)",
            "Immediate Generator: I, S, B, U, J type encoding",
            "IOBUS interface for peripheral I/O",
          ],
          confidence: "VERIFIED",
          evidenceSource: "OTTER_Architecture_No_Interrupts_1.pdf",
        },
        {
          id: "fsm-systems",
          title: "FSM-Based Control Systems",
          description: "State machine design for sequential control including timing and transition logic",
          details: [
            "Moore and Mealy machine implementations",
            "State encoding strategies: binary, one-hot, gray",
            "Timing control via clock division",
            "Output logic and state transition tables",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "CPE 133 / CPE 233 coursework — evidence upload pending",
        },
        {
          id: "fpga-implementation",
          title: "FPGA Implementation",
          description: "Digital logic building blocks implemented on FPGA: multiplexers, flip-flops, shift registers, clock dividers",
          details: [
            "Combinational: MUX, decoder, encoder",
            "Sequential: D-FF, shift registers, counters",
            "Clock domain management and division",
            "Synthesis and place-and-route via Vivado",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "CPE 133 labs — evidence upload pending",
        },
      ],
      implementationNotes: [
        "OTTER MCU written in SystemVerilog, synthesized in Vivado",
        "PC supports 4 sources: PC+4, jalr, branch, jal via pcSource MUX",
        "ALU: 10 operations selected by alu_fun[3:0]",
        "Branch: br_eq, br_lt, br_ltu signals to CU_DCDR",
        "RF: dual-read (rs1, rs2), single-write with rf_wr_sel MUX",
        "Memory: dual-port BRAM, byte/half/word access with sign extension",
        "FSM states: FETCH, EXEC — minimum 2 cycles per instruction",
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
      keyInsight: "Timing is everything in digital systems. The difference between combinational and sequential logic determines when data is valid. State machines control the system — every instruction's execution is a sequence of precisely-timed control signals that must be generated in the correct order.",
      verificationSummary: [
        { parameter: "ISA", value: "RV32I", unit: "", evidence_source: "OTTER_Architecture, p1", confidence: "VERIFIED" },
        { parameter: "ALU Operations", value: "10", unit: "functions", evidence_source: "OTTER_Architecture, p1", confidence: "VERIFIED" },
        { parameter: "Register File", value: "32×32", unit: "bit", evidence_source: "OTTER_Architecture, p1", confidence: "VERIFIED" },
        { parameter: "FSM States", value: "2", unit: "(FETCH, EXEC)", evidence_source: "OTTER_Architecture, p1", confidence: "VERIFIED" },
        { parameter: "PC Sources", value: "4", unit: "MUX inputs", evidence_source: "OTTER_Architecture, p1", confidence: "VERIFIED" },
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
    techStack: ["SystemVerilog", "Vivado", "RISC-V ISA", "FPGA", "FSM Design"],
  },

  // ===== DOMAIN: MANUFACTURING =====
  {
    id: "manufacturing-systems",
    name: "Manufacturing & CAD Systems",
    codename: "MFG-SYS",
    domain: "manufacturing",
    course: "IME 144",
    status: "COMPLETE",
    statusColor: "neon-green",
    heroSummary: "Design-to-manufacturing pipeline: parametric CAD → engineering drawings with GD&T → manual machining (lathe, mill) → assembly. 6 precision-machined parts for pneumatic air motor.",
    has3D: true,
    hologramType: "physical",
    module: {
      problemStatement: "How do you take a design from CAD model to physical part — accounting for tolerances, material properties, and manufacturing constraints at every step?",
      systemOverview: "Complete design-to-manufacturing pipeline for a pneumatic air motor. Covers parametric CAD modeling, engineering drawings with GD&T per ASME Y14.5, manual machining on lathe and mill, metrology, and final assembly.",
      systemArchitecture: "CAD Model (SolidWorks) → Engineering Drawing (GD&T) → Production Plan → Material Selection → Machining (Lathe/Mill) → Inspection (Metrology) → Assembly",
      subsystems: [
        {
          id: "cad-modeling",
          title: "CAD Modeling & Parametric Design",
          description: "SolidWorks parametric models with dimensional constraints, mates, and assembly verification",
          details: [
            "Parametric feature-based modeling",
            "Assembly constraints and mate definitions",
            "Interference detection",
            "Drawing generation from 3D models",
          ],
          confidence: "VERIFIED",
          evidenceSource: "SolidWorks part files (.SLDPRT)",
        },
        {
          id: "machining",
          title: "Manual Machining Operations",
          description: "Precision machining on manual lathe and milling machine with calculated feeds and speeds",
          details: [
            "Lathe operations: facing, turning, boring, threading",
            "Mill operations: face milling, slot milling, drilling",
            "Feeds & speeds calculated per material and tool",
            "Sawing, threading, broaching operations",
          ],
          confidence: "VERIFIED",
          evidenceSource: "IME_144_MANUAL.pdf, pp.224-285",
        },
        {
          id: "metrology",
          title: "Metrology & Inspection",
          description: "Dimensional inspection using precision measurement tools",
          details: [
            "Calipers: ±0.001 in resolution",
            "Micrometers: ±0.0001 in resolution",
            "Dial indicators for runout and flatness",
            "Gage blocks for calibration verification",
          ],
          confidence: "VERIFIED",
          evidenceSource: "IME_144_MANUAL.pdf",
        },
      ],
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
      keyInsight: "The gap between a CAD model and a physical part is defined by tolerances. Real-world manufacturing introduces variation from tool wear, thermal expansion, fixturing, and operator technique. GD&T communicates design intent so manufacturing and inspection can verify parts independently.",
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

  // ===== FUNCK (cross-domain: web/systems) =====
  {
    id: "funck",
    name: "Funck — Event Ticketing Platform",
    codename: "FUNCK",
    domain: "signal-systems",
    course: undefined,
    status: "ACTIVE",
    statusColor: "neon-cyan",
    heroSummary: "Live event ticketing platform with QR tickets, Stripe payments, fraud prevention, and demand-based pricing. Shipped and operating at funck.live.",
    has3D: true,
    hologramType: "network",
    module: {
      problemStatement: "How do you build a production ticketing system that handles payments, fraud prevention, and real-time event management?",
      systemOverview: "Full-stack event ticketing platform with presale tickets, QR code issuance, fraud prevention, demand-based pricing, Stripe Connect payouts, group split-pay, and analytics.",
      systemArchitecture: "Client (React) → Lovable App → Supabase (PostgreSQL + Auth + Edge Functions) → Stripe (payments + Connect payouts) → Resend (email delivery)",
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
        conceptualNote: "Architecture reflects actual production system at funck.live.",
      },
    ],
    evidence: [
      { id: "funck-live", fileName: "www.funck.live", type: "link", description: "Live production URL", url: "https://www.funck.live" },
    ],
    techStack: ["React", "Lovable", "Supabase", "Stripe", "Resend", "TypeScript"],
  },

  // ===== DOMAIN: MATERIALS ENGINEERING =====
  // PROJECT GROUP A: Phases, Transformations, Microstructure
  {
    id: "materials-phases",
    name: "Phases, Microstructure, and Property Control in Engineering Alloys",
    codename: "MATE-PHASE",
    domain: "materials",
    course: "MATE 210 / MATE 215",
    status: "COMPLETE",
    statusColor: "neon-amber",
    heroSummary: "Phase diagram reasoning, cold work/recrystallization mechanics, and heat treatment of steels. Structure–property–processing control from eutectic solidification through eutectoid transformation.",
    has3D: true,
    hologramType: "scientific",
    module: {
      problemStatement: "How do phase diagrams, deformation history, and thermal processing combine to control the microstructure and mechanical properties of engineering alloys?",
      systemOverview: "Integrates three interconnected materials concepts: (1) binary phase diagram interpretation and cooling behavior, (2) cold work → recovery → recrystallization → grain growth progression, and (3) Fe-C phase transformations and heat treatment logic for steels.",
      systemArchitecture: "Composition + Temperature → Phase Diagram → Phase Fields → Microstructure Prediction → Property Control | Deformation → Dislocation Density → Annealing → Recrystallization → Grain Size → Properties | Austenitize → Cooling Rate → Pearlite/Bainite/Martensite → Hardness/Ductility",
      subsystems: [
        {
          id: "phase-diagrams",
          title: "Phase Diagram Reasoning (Pb-Sn Eutectic)",
          description: "Binary eutectic phase diagram interpretation: phase fields, eutectic composition/temperature, cooling paths, and primary/proeutectic phase formation. Pb-Sn system used as the model eutectic.",
          details: [
            "Pb-Sn eutectic system: eutectic at 61.9 wt% Sn, 183°C (Lab 4, p3–4)",
            "α solvus: max solubility 18.3 wt% Sn at 183°C; β solvus: 97.8 wt% Sn at 183°C (Lab 4, p3)",
            "Pure Pb melts at 327°C, pure Sn at 232°C (Lab 4, Fig.1)",
            "Cooling curve features: slope change (α+L region) and thermal arrest (eutectic at 183°C) (Lab 4, p4–5)",
            "Proeutectic α forms above eutectic T; eutectic reaction L → α + β occurs at 183°C (Lab 4, p5)",
            "Lever rule calculates phase fractions from tie lines in two-phase regions (Lab 4, p2)",
            "Hypoeutectic: primary α + eutectic; Hypereutectic: primary β + eutectic (Lab 4, p5)",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_4_Phase_Diagrams_Spring_2017_1.pdf, pp.1–8",
        },
        {
          id: "cold-work-recrystallization",
          title: "Cold Work and Recrystallization",
          description: "Dislocation mechanics linking strain hardening, recovery, recrystallization, and grain growth to mechanical property changes. Demonstrated on α-brass (70Cu-30Zn).",
          details: [
            "Cold work creates and multiplies dislocations → 'dislocation traffic jam' resists further deformation (Lab 7, p1–2)",
            "Strain hardening: each successive bend requires more force as dislocation density increases (Lab 7, p2)",
            "Recovery: atoms rearrange to lower-strain config at elevated T; minimal property change (Lab 7, p3)",
            "Recrystallization: nucleation and growth of new strain-free grains from cold-worked structure (Lab 7, p3–4)",
            "Grain growth: continued heating causes recrystallized grains to coarsen (Lab 7, p3)",
            "α-brass micrographs show progression: slip lines → tiny new grains → partial recrystallization → fully recrystallized (Lab 7, Fig.2A–D, 75x)",
            "TRex ≈ 0.3–0.5 × melting temperature (K), also depends on amount of cold work (Lab 7, p5)",
            "Property reversal: annealing restores ductility and reduces yield strength back toward pre-cold-worked state (Lab 7, Fig.3)",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_7_Cold_Work_and_Annealing_SPR_2017.pdf, pp.1–8",
        },
        {
          id: "heat-treatment-steels",
          title: "Heat Treatment of Steels",
          description: "Fe-C eutectoid transformation: austenite → pearlite/ferrite/cementite. Steels used: 1018, 1050, 1095 (plain carbon). TTT diagram interpretation for non-equilibrium structures.",
          details: [
            "Eutectoid composition: 0.77 wt% C at 727°C (Lab 8, Fig.1, p2)",
            "Austenite (γ-FCC) is the high-temperature starting phase — all C dissolved interstitially (Lab 8, p2)",
            "Ferrite (α-BCC): nearly pure Fe, max 0.022 wt% C — soft and deformable (Lab 8, p3)",
            "Cementite (Fe₃C): 6.67 wt% C — extremely hard and brittle (Lab 8, p3)",
            "Eutectoid reaction: γ → α + Fe₃C produces pearlite — alternating lamellae of ferrite and cementite (Lab 8, p3, Fig.2)",
            "Hypoeutectoid (<0.77%C): proeutectoid ferrite + pearlite (Lab 8, p4, Fig.3)",
            "Hypereutectoid (>0.77%C): proeutectoid cementite 'ribbons' + pearlite (Lab 8, p5, Fig.4)",
            "Rapid cooling (quench) → martensite (BCT, hard, brittle) — C trapped, no time for diffusion (Lab 8, p5–6)",
            "IT/TTT diagrams map transformation products vs time at constant temperature (Lab 8, p6, Fig.5)",
            "Bainite forms at intermediate cooling rates — finer than pearlite (Lab 8, p6)",
          ],
          confidence: "VERIFIED",
          evidenceSource: "Lab_8_Steel_Heat_Treatment_SPR_2017.pdf, pp.1–10",
        },
      ],
      implementationNotes: [
        "Phase diagram interpretation requires understanding of Gibbs phase rule: F = C - P + 1 (for constant pressure)",
        "Lever rule provides quantitative phase fractions at any T and composition",
        "Recrystallization temperature typically 0.3–0.5 × melting point (K)",
        "TTT diagrams are isothermal; CCT diagrams better represent continuous cooling",
      ],
      failureModes: [
        {
          problem: "Unexpected brittleness after cold working",
          cause: "Excessive cold work without intermediate annealing — ductility exhausted",
          fix: "Introduce intermediate annealing steps to restore ductility before further deformation",
          systemImpact: "Part fractures during forming or in service",
          confidence: "CONCEPTUAL",
        },
        {
          problem: "Inconsistent hardness after heat treatment",
          cause: "Non-uniform cooling rate — section thickness variations cause different transformation products",
          fix: "Control quench severity and part geometry; consider jominy hardenability analysis",
          systemImpact: "Mixed martensite/pearlite regions with unpredictable mechanical behavior",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Add quantitative lever rule calculator",
        "Include real micrograph annotations when evidence uploaded",
        "Add Jominy hardenability exploration",
      ],
      keyInsight: "Structure controls properties. Processing controls structure. Therefore, processing controls properties. Every decision about composition, temperature, time, and cooling rate determines what phases form, what microstructure develops, and what mechanical behavior results.",
    },
    diagrams: [],
    evidence: [
      { id: "lab4-pdf", fileName: "Lab_4_Phase_Diagrams_Spring_2017_1.pdf", type: "pdf", description: "Pb-Sn eutectic phase diagram lab — cooling curves, phase fields, lever rule, microstructure" },
      { id: "lab7-pdf", fileName: "Lab_7_Cold_Work_and_Annealing_SPR_2017.pdf", type: "pdf", description: "α-brass cold work and annealing — dislocation mechanics, recrystallization, micrographs" },
      { id: "lab8-pdf", fileName: "Lab_8_Steel_Heat_Treatment_SPR_2017.pdf", type: "pdf", description: "Fe-C heat treatment — austenite transformation, pearlite, martensite, TTT diagrams" },
    ],
    techStack: ["Phase Diagrams", "Metallography", "Heat Treatment", "Mechanical Testing", "Microstructure Analysis"],
  },

  // PROJECT GROUP B: Corrosion
  {
    id: "materials-corrosion",
    name: "Corrosion, Electrochemical Failure, and Prevention",
    codename: "MATE-CORR",
    domain: "materials",
    course: "MATE 210",
    status: "COMPLETE",
    statusColor: "neon-amber",
    heroSummary: "Electrochemical corrosion fundamentals: anode/cathode/electrolyte/path model, galvanic series reasoning, and design strategies for corrosion prevention in engineering systems.",
    has3D: true,
    hologramType: "scientific",
    module: {
      problemStatement: "How does electrochemical corrosion degrade materials, and how can engineers interrupt the corrosion mechanism through design?",
      systemOverview: "Corrosion as a systems-level failure mode: four required elements (anode, cathode, electrolyte, electrical path), galvanic series for material selection, and engineering strategies to prevent or mitigate material degradation.",
      systemArchitecture: "Anode (oxidation: M → M²⁺ + 2e⁻) → Electrical Path (e⁻ flow) → Cathode (reduction: O₂ + 2H₂O + 4e⁻ → 4OH⁻) → Electrolyte (ion transport) → Anode (cycle)",
      subsystems: [
        {
          id: "corrosion-fundamentals",
          title: "Corrosion Fundamentals",
          description: "Four required elements for corrosion: anode, cathode, electrolyte, and electrical path. Remove any one to stop corrosion.",
          details: [
            "Anode: metal that undergoes oxidation (loses electrons, dissolves)",
            "Cathode: site where reduction occurs (gains electrons)",
            "Electrolyte: ionic conduction medium (water, soil, etc.)",
            "Electrical path: metallic connection for electron flow",
            "Oxidation reaction: M → Mⁿ⁺ + ne⁻",
            "Reduction reaction: O₂ + 2H₂O + 4e⁻ → 4OH⁻ (in neutral/basic solution)",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "MATE course materials — evidence upload pending",
        },
        {
          id: "galvanic-series",
          title: "Corrosion Potential & Galvanic Series",
          description: "Why some metals corrode preferentially when coupled — electrode potential determines anodic/cathodic behavior",
          details: [
            "More negative potential → more anodic → preferentially corrodes",
            "Galvanic series ranks metals by corrosion potential in seawater",
            "Large potential difference → faster galvanic corrosion",
            "Area ratio effect: small anode + large cathode → accelerated attack",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "MATE course materials — evidence upload pending",
        },
        {
          id: "corrosion-prevention",
          title: "Design Implications & Prevention",
          description: "Engineering strategies to interrupt the corrosion cell by removing one of the four required elements",
          details: [
            "Coatings/barriers: remove electrolyte contact (paint, anodizing)",
            "Cathodic protection: sacrificial anode or impressed current",
            "Material selection: choose compatible metals (minimize galvanic potential)",
            "Design: avoid crevices, ensure drainage, minimize dissimilar metal contact",
            "Inhibitors: chemical additives that passivate metal surface",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "MATE course materials — evidence upload pending",
        },
      ],
      implementationNotes: [
        "Corrosion requires ALL FOUR elements simultaneously",
        "Removing any single element stops the corrosion process",
        "Galvanic corrosion is the most common in multi-material assemblies",
        "Design review should check for dissimilar metal contact in electrolyte",
      ],
      failureModes: [
        {
          problem: "Accelerated galvanic corrosion at fastener joints",
          cause: "Steel fasteners in aluminum structure with moisture ingress — large cathode/small anode ratio",
          fix: "Use insulating washers, select compatible alloys, or apply protective coatings",
          systemImpact: "Rapid localized metal loss at fastener holes, structural integrity compromised",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Add interactive galvanic series explorer",
        "Include real corrosion sample images when evidence uploaded",
      ],
      keyInsight: "Corrosion is not random — it is a predictable electrochemical process. Every corrosion failure can be traced to the presence of all four elements: anode, cathode, electrolyte, and electrical path. Engineering prevention means deliberately eliminating at least one.",
    },
    diagrams: [],
    evidence: [],
    techStack: ["Electrochemistry", "Galvanic Series", "Failure Analysis", "Material Selection", "Corrosion Prevention"],
  },

  // PROJECT GROUP C: Polymers & Lightweight Materials
  {
    id: "materials-polymers",
    name: "Lightweight Materials, Mechanical Behavior, and Transport Design",
    codename: "MATE-POLY",
    domain: "materials",
    course: "MATE 210 / MATE 215",
    status: "EVIDENCE_PENDING",
    statusColor: "neon-amber",
    heroSummary: "Thermoplastic structure–property relationships and CFRP vs 6061-T6 aluminum analysis for transit vehicle design. Structure–properties–processing–performance framework applied to real transport engineering decisions.",
    has3D: true,
    hologramType: "scientific",
    module: {
      problemStatement: "How do molecular structure and processing control the mechanical behavior of polymers, and how do composite materials compare to metals for lightweight transport applications?",
      systemOverview: "Two interconnected modules: (1) thermoplastic polymer mechanical behavior driven by molecular structure and secondary bonding, and (2) CFRP vs 6061-T6 aluminum material selection analysis for bus rapid transit and rail applications.",
      systemArchitecture: "Molecular Structure (chain architecture, bonding) → Processing (temperature, forming) → Microstructure (crystallinity, orientation) → Properties (E, σy, εf) → Performance (specific strength, cost, lifecycle)",
      subsystems: [
        {
          id: "thermoplastics",
          title: "Thermoplastic Mechanical Behavior",
          description: "How molecular structure, secondary bonding, and chain motion control stiffness, strength, and ductility in engineering polymers",
          details: [
            "PE: flexible chains, low Tg, high ductility, low stiffness",
            "PVC: Cl side groups restrict chain motion → higher stiffness",
            "PS: bulky phenyl groups → rigid, brittle, high Tg",
            "PC: carbonate linkages → high impact resistance, optical clarity",
            "PMMA: polar side groups → stiff, brittle, excellent optical clarity",
            "Secondary bonding (van der Waals, dipole, H-bond) determines Tg and melt behavior",
            "Crystallinity increases stiffness and strength but may reduce ductility",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "MATE course materials — evidence upload pending",
        },
        {
          id: "cfrp-vs-aluminum",
          title: "CFRP vs 6061-T6 Aluminum for Transit",
          description: "Structure–properties–processing–performance comparison for short-haul BRT and longer-range rail applications",
          details: [
            "CFRP: high specific strength (σ/ρ), excellent fatigue, but high cost and complex repair",
            "6061-T6: moderate specific strength, well-understood processing, lower cost, easier repair",
            "Short-haul BRT: frequent acceleration/braking → weight savings from CFRP maximize energy efficiency",
            "Long-range rail: constant speed operation → cost-effectiveness of aluminum may dominate",
            "Lifecycle considerations: CFRP repair costs vs aluminum recyclability",
            "Density: CFRP ~1.6 g/cm³ vs 6061-T6 ~2.7 g/cm³",
            "Tensile strength: CFRP ~600-3000 MPa vs 6061-T6 ~310 MPa",
          ],
          confidence: "CONCEPTUAL",
          evidenceSource: "CFRP vs Aluminum white paper — evidence upload pending",
        },
      ],
      implementationNotes: [
        "Structure–properties–processing–performance is the central framework",
        "Specific strength (σ/ρ) is the critical metric for weight-sensitive transport",
        "Material selection is always application-dependent — no universally 'best' material",
        "CFRP advantages diminish when weight savings don't significantly affect energy consumption",
      ],
      failureModes: [
        {
          problem: "Polymer creep under sustained load",
          cause: "Viscoelastic behavior — chain sliding under stress at temperatures near Tg",
          fix: "Select polymer with Tg well above service temperature; reduce sustained stress",
          systemImpact: "Dimensional instability and eventual failure under constant load",
          confidence: "CONCEPTUAL",
        },
        {
          problem: "CFRP delamination under impact",
          cause: "Interlaminar shear failure — weak matrix-dominated property in through-thickness direction",
          fix: "Add interleaved toughening layers; design for damage tolerance inspection",
          systemImpact: "Hidden internal damage not visible on surface — requires NDT for detection",
          confidence: "CONCEPTUAL",
        },
      ],
      improvements: [
        "Add cost-per-performance comparison calculator",
        "Include stress-strain data from actual tensile tests when evidence uploaded",
        "Add Ashby chart exploration module",
      ],
      keyInsight: "Material selection is never about finding the 'strongest' material — it's about matching the structure–properties–processing–performance chain to application requirements. CFRP wins on specific strength; aluminum wins on cost and repairability. The right choice depends on the system context.",
    },
    diagrams: [],
    evidence: [],
    techStack: ["Polymer Science", "Composite Materials", "Material Selection", "Mechanical Testing", "Transport Engineering"],
  },
];

// ========== EXPERIENCE ==========
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
  core: ["Systems Thinking", "Test & Validation Mindset", "Technical Documentation", "Debugging & Root Cause Analysis"],
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
    { name: "PCB Design & Reflow", evidence: "EE 143 DAC PCB", confidence: "CONCEPTUAL" as ConfidenceBadge },
    { name: "Materials Engineering", evidence: "MATE 210/215 coursework", confidence: "CONCEPTUAL" as ConfidenceBadge },
    { name: "Phase Diagram Analysis", evidence: "MATE 210 labs", confidence: "CONCEPTUAL" as ConfidenceBadge },
  ],
};

// ========== PERSONAL INFO ==========
export const personalInfo = {
  name: "Amogh Somisetty",
  title: "Electrical Engineering",
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
