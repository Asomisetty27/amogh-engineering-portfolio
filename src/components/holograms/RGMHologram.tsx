import HologramViewer, { type PartInfo } from "@/components/HologramViewer";

const rgmParts: PartInfo[] = [
  {
    name: "Capacitive Piano (Stage 1)",
    description: "Four copper foil touch pads on Arduino Mega with 2.2 MΩ RC circuits",
    function: "Input trigger — user enters correct 5-note sequence (1,3,2,4,1) to start chain reaction",
    position: [-4, 0, 0],
    geometry: "box",
    scale: [1.2, 0.3, 1.5],
    color: "#00d4aa",
    evidenceSource: "Lab_Final_Report, p3",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Relay Module (Stage 2)",
    description: "BC548 NPN transistor switches relay to isolate 5V Arduino from 9V strobe circuit",
    function: "Electrical isolation — connects 9V supply to strobe light on piano completion",
    position: [-2.8, 0.5, 0],
    geometry: "box",
    scale: [0.6, 0.6, 0.8],
    color: "#44aaff",
    evidenceSource: "Lab_Final_Report, p3",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Strobe Light (Stage 3)",
    description: "RC oscillator drives step-up transformer generating ~580V for xenon flash tube",
    function: "Produces bright flash to trigger light detector in next stage",
    position: [-1.5, 0.8, 0.5],
    geometry: "cylinder",
    scale: [0.5, 1, 0.5],
    color: "#ffaa00",
    evidenceSource: "Lab_Final_Report, p3",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Light Detector + Schmitt Trigger (Stage 4)",
    description: "Photoresistor + LM324 Op-Amp Schmitt trigger with adjustable VR1 threshold",
    function: "Detects strobe flash (filters ambient light) and outputs clean digital trigger to solenoid",
    position: [-0.3, 0.5, -0.5],
    geometry: "box",
    scale: [0.8, 0.4, 0.6],
    color: "#ff4488",
    evidenceSource: "Lab_Final_Report, p3-4; Light_detector_Somisetty_A_CA.f3d",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Solenoid + Track (Stage 5)",
    description: "Solenoid actuator in custom track (6×2×1 in, 0.75 in cutout) launches steel marble",
    function: "Physically launches steel marble into inductor coil of metal detector",
    position: [1, 0, 0],
    geometry: "cylinder",
    scale: [0.4, 1.5, 0.4],
    color: "#00aaff",
    rotation: [0, 0, Math.PI / 2] as [number, number, number],
    evidenceSource: "Lab_Final_Report, p4; Solenoid_Track_v2.f3d",
    confidence: "CONCEPTUAL",
  },
  {
    name: "555 Metal Detector Coil (Stage 6)",
    description: "NE555 astable LC oscillator — baseline 8,760 Hz, with metal: 8,310 Hz (5.1% drop)",
    function: "Detects steel marble via frequency shift; signals Arduino when ≥4% drop confirmed",
    position: [2.5, 0, 0],
    geometry: "ring",
    scale: [1.2, 1.2, 1.2],
    color: "#00ff88",
    evidenceSource: "Lab_Final_Report, p4",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Electromagnet (Stage 7)",
    description: "MOSFET-controlled electromagnet on Arduino pin 11, holding ball above tilt switch",
    function: "Holds steel ball; releases when Arduino confirms ≥4% frequency drop (STREAK_N=5)",
    position: [3.5, 1, 0],
    geometry: "cylinder",
    scale: [0.6, 0.4, 0.6],
    color: "#ff6644",
    evidenceSource: "Lab_Final_Report, p4",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Tilt Switch (Stage 8)",
    description: "SPST normally-open tilt switch, connected to Arduino with INPUT_PULLUP",
    function: "Closed by falling steel ball — pulls Arduino pin LOW to trigger LCD output",
    position: [3.5, -1, 0],
    geometry: "sphere",
    scale: [0.3, 0.3, 0.3],
    color: "#ffcc00",
    evidenceSource: "Lab_Final_Report, p5",
    confidence: "CONCEPTUAL",
  },
  {
    name: "I2C LCD Display (Stage 9)",
    description: "Inland 16×2 LCD with PCF8574 I2C backpack (address 0x27)",
    function: "Displays 2 rows of 16 white blocks to confirm successful RGM completion",
    position: [4.5, 0, 0],
    geometry: "box",
    scale: [1.2, 0.6, 0.2],
    color: "#00ffcc",
    evidenceSource: "Lab_Final_Report, p5-6",
    confidence: "CONCEPTUAL",
  },
  {
    name: "Arduino Mega (Controller)",
    description: "Arduino Mega — central controller for frequency reading, magnet control, tilt detection, and LCD",
    function: "Reads pulseIn() frequency, manages streak logic, controls MOSFET and LCD via I2C",
    position: [2, -1.5, -1],
    geometry: "box",
    scale: [1.5, 0.2, 1],
    color: "#4488ff",
    evidenceSource: "Lab_Final_Report, p7-10 (code); Arduino_Uno_Model_1.f3d",
    confidence: "CONCEPTUAL",
  },
];

export default function RGMHologram() {
  return (
    <HologramViewer
      parts={rgmParts}
      title="RGM System — 3D Hologram"
      confidence="CONCEPTUAL"
      sourceFiles={[
        "Solenoid_Track_v2.f3d",
        "Light_detector_Somisetty_A_CA.f3d",
        "Arduino_Uno_Model_1.f3d",
        "Eagle_1_Inch_Square_PCB_Model.f3d",
      ]}
      conceptualNote="Spatial layout is approximate. Individual CAD files uploaded but require .GLB export for verified 3D rendering."
    />
  );
}
