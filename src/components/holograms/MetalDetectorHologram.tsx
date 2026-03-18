import HologramViewer, { type PartInfo } from "@/components/HologramViewer";

const parts: PartInfo[] = [
  {
    name: "Inductor Coil (L1 = 0.5mH)",
    description: "Sensing coil — steel marble enters and changes inductance, shifting oscillation frequency",
    function: "Primary sensor element. Baseline 8,760 Hz → 8,310 Hz with metal (5.1% drop)",
    position: [0, 0, 0],
    geometry: "ring",
    scale: [1.5, 1.5, 1.5],
    color: "#00ff88",
    evidenceSource: "Lab_Final_Report, p4; EE_241_Lab_6",
    confidence: "CONCEPTUAL",
  },
  {
    name: "NE555 Timer IC",
    description: "NE555 in astable mode forming LC oscillator circuit with inductor and capacitors",
    function: "Generates oscillating frequency modulated by inductor changes. Output read by Arduino pulseIn()",
    position: [-2, 0, 0],
    geometry: "box",
    scale: [0.8, 0.3, 0.6],
    color: "#44aaff",
    evidenceSource: "EE_241_Lab_6, schematic",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Solenoid Actuator",
    description: "Launches steel marble from custom track into inductor coil",
    function: "Mechanical input to detection stage — plunger pushes marble down 6×2×1 in track",
    position: [-3.5, 0, 0],
    geometry: "cylinder",
    scale: [0.4, 1.5, 0.4],
    rotation: [0, 0, Math.PI / 2] as [number, number, number],
    color: "#00aaff",
    evidenceSource: "Lab_Final_Report, p4; Solenoid_Track_v2.f3d",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Steel Marble",
    description: "Ferromagnetic ball that changes inductor coil inductance when present",
    function: "Detection target — causes 5.1% frequency drop in LC oscillator",
    position: [-1, 0, 0],
    geometry: "sphere",
    scale: [0.3, 0.3, 0.3],
    color: "#cccccc",
    evidenceSource: "Lab_Final_Report, p4",
    confidence: "CONCEPTUAL",
  },
  {
    name: "MOSFET (N-Ch 30V/40A)",
    description: "Controls current to electromagnet. Gate driven by Arduino pin 11",
    function: "Switches electromagnet on/off. Requires shared ground between Arduino and 9V supply",
    position: [2, 1, 0],
    geometry: "box",
    scale: [0.5, 0.4, 0.3],
    color: "#ff6644",
    evidenceSource: "EE_241_Lab_7, p2; Lab_Final_Report, p4",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Electromagnet (2.5kg hold)",
    description: "5V electromagnet holding steel ball above tilt switch until detection confirmed",
    function: "Holds ball via magnetic field. Released when Arduino sets pin 11 LOW after STREAK_N=5 confirmed readings",
    position: [3, 1.5, 0],
    geometry: "cylinder",
    scale: [0.6, 0.5, 0.6],
    color: "#ff4488",
    evidenceSource: "EE_241_Lab_7, p1; Lab_Final_Report, p4",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Flyback Diode (1N4004)",
    description: "Protection diode across solenoid/electromagnet coils",
    function: "Absorbs back-EMF from inductive kickback when MOSFET switches off",
    position: [2.5, 0.5, 0.5],
    geometry: "box",
    scale: [0.3, 0.15, 0.15],
    color: "#ffcc00",
    evidenceSource: "EE_241_Lab_7, p1",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Arduino Mega (Controller)",
    description: "Reads frequency via pulseIn(), manages streak counter and threshold logic",
    function: "Central controller: FREQ_PIN=8, MAG_PIN=9/11, BASE_FREQ=8600, TRIP_DELTA=150",
    position: [0, -2, 0],
    geometry: "box",
    scale: [2, 0.2, 1.2],
    color: "#4488ff",
    evidenceSource: "Lab_Final_Report, p7-10 (code)",
    confidence: "CONCEPTUAL",
  },
];

export default function MetalDetectorHologram() {
  return (
    <HologramViewer
      parts={parts}
      title="Metal Detection & Electromagnet Release — 3D"
      confidence="CONCEPTUAL"
      sourceFiles={[
        "Solenoid_Track_v2.f3d",
        "EE_241_Lab_6_Electric_Circuit_Analysis_1.pdf",
        "EE_241_Lab_7_Electric_Circuit_Analysis.pdf",
        "Lab_Final_Report_Amogh_Somisetty.pdf",
      ]}
      conceptualNote="Conceptual spatial layout. Solenoid_Track_v2.f3d uploaded but needs .GLB export for verified rendering."
    />
  );
}
