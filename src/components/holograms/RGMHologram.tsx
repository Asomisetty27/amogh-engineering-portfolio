import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfidenceBadgeTag } from "@/components/ui/mission-ui";
import HologramModeBar, { type HologramMode } from "@/components/ui/HologramModeBar";

interface RGMStageData {
  id: number;
  name: string;
  shortName: string;
  x: number;
  y: number;
  color: string;
  trigger: string;
  activeComponents: string[];
  output: string;
  evidenceSource: string;
  failureMode?: string;
  failureCause?: string;
}

const stages: RGMStageData[] = [
  { id: 1, name: "Capacitive Touch Arduino Piano", shortName: "PIANO", x: 30, y: 45, color: "#00d4aa",
    trigger: "Human touch — correct 5-note sequence (1,3,2,4,1)", activeComponents: ["Arduino Mega", "Copper foil pads", "2.2MΩ RC circuits", "Buzzer"],
    output: "Relay activation (pin 8 HIGH)", evidenceSource: "Lab_Final_Report, p3",
    failureMode: "RC time constant discrepancy (38.5% error)", failureCause: "Oscilloscope cursor positioning, component tolerances, breadboard contact resistance" },
  { id: 2, name: "Relay — Piano to Strobe", shortName: "RELAY", x: 75, y: 45, color: "#44aaff",
    trigger: "Relay activation signal from piano Arduino", activeComponents: ["BC548 NPN transistor", "Relay module", "Flyback diode"],
    output: "9V power connected to strobe circuit", evidenceSource: "Lab_Final_Report, p3" },
  { id: 3, name: "Strobe Light", shortName: "STROBE", x: 120, y: 45, color: "#ffaa00",
    trigger: "9V supply from relay", activeComponents: ["Step-up transformer (~580V)", "Xenon flash tube", "SCR trigger", "RC oscillator"],
    output: "Bright xenon flash", evidenceSource: "Lab_Final_Report, p3",
    failureMode: "Strobe not flashing", failureCause: "Broken transistor lead in oscillator stage" },
  { id: 4, name: "Light Detector + Schmitt Trigger", shortName: "LIGHT\nDETECT", x: 165, y: 45, color: "#ff4488",
    trigger: "Strobe flash detected by photoresistor", activeComponents: ["Photoresistor", "LM324 Op-Amp", "Schmitt trigger", "VR1 threshold pot"],
    output: "Clean digital trigger to solenoid", evidenceSource: "Lab_Final_Report, p3-4",
    failureMode: "False trigger from ambient light", failureCause: "VR1 voltage divider reference too low — room lighting exceeded threshold" },
  { id: 5, name: "Solenoid Launcher", shortName: "SOLENOID", x: 210, y: 45, color: "#00aaff",
    trigger: "Digital trigger from light detector", activeComponents: ["Solenoid actuator", "Custom track (6×2×1 in)", "Steel marble"],
    output: "Steel marble launched into inductor coil", evidenceSource: "Lab_Final_Report, p4" },
  { id: 6, name: "555 Metal Detector", shortName: "METAL\nDETECT", x: 255, y: 45, color: "#00ff88",
    trigger: "Steel marble enters inductor coil", activeComponents: ["NE555 timer (astable)", "LC oscillator", "Arduino pulseIn()", "Inductor coil (L₁=0.5mH)"],
    output: "Frequency drop detection (8760→8310 Hz, 5.1%)", evidenceSource: "Lab_Final_Report, p4",
    failureMode: "Electromagnet releasing prematurely", failureCause: "Small frequency fluctuations falsely exceeded threshold before marble entered coil" },
  { id: 7, name: "Electromagnet Release", shortName: "ELECTRO\nMAGNET", x: 300, y: 45, color: "#ff6644",
    trigger: "Arduino confirms ≥4% frequency drop (STREAK_N=5)", activeComponents: ["MOSFET (N-Ch 30V/40A)", "Electromagnet (2.5kg hold)", "Arduino pin 11"],
    output: "Steel ball released from electromagnet", evidenceSource: "Lab_Final_Report, p4",
    failureMode: "MOSFET not switching", failureCause: "No common ground between Arduino (USB 5V) and 9V supply" },
  { id: 8, name: "Tilt Switch", shortName: "TILT\nSWITCH", x: 345, y: 45, color: "#ffcc00",
    trigger: "Steel ball falls under gravity onto tilt switch", activeComponents: ["Tilt switch (SPST, N.O.)", "INPUT_PULLUP on Arduino"],
    output: "Arduino digital input pulled LOW", evidenceSource: "Lab_Final_Report, p5" },
  { id: 9, name: "LCD Display", shortName: "LCD", x: 380, y: 45, color: "#00ffcc",
    trigger: "Tilt switch pulls Arduino pin LOW", activeComponents: ["Inland 16×2 I2C LCD", "PCF8574 (0x27)", "Custom 0xFF block char"],
    output: "2×16 white blocks — RGM COMPLETE", evidenceSource: "Lab_Final_Report, p5-6" },
];

// Arduino controller sits below the chain
const arduinoBlock = { x: 220, y: 78, name: "Arduino Mega (Controller)", color: "#4488ff" };

export default function RGMHologram() {
  const [mode, setMode] = useState<HologramMode>("idle");
  const [activeStage, setActiveStage] = useState(0);
  const [selectedStage, setSelectedStage] = useState<RGMStageData | null>(null);
  const [tick, setTick] = useState(0);

  // Idle ambient animation
  useEffect(() => {
    if (mode !== "idle" && mode !== "play") return;
    const interval = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(interval);
  }, [mode]);

  // Auto-play mode
  useEffect(() => {
    if (mode !== "play") return;
    const interval = setInterval(() => {
      setActiveStage(prev => {
        const next = prev + 1;
        if (next >= stages.length) return 0;
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [mode]);

  const handleModeChange = useCallback((m: HologramMode) => {
    setMode(m);
    if (m === "step") setActiveStage(0);
    if (m === "idle") { setActiveStage(0); setSelectedStage(null); }
  }, []);

  const nextStep = () => setActiveStage(prev => Math.min(prev + 1, stages.length - 1));
  const prevStep = () => setActiveStage(prev => Math.max(prev - 1, 0));

  const isStageActive = (idx: number) => {
    if (mode === "idle") return false;
    if (mode === "step" || mode === "play") return idx <= activeStage;
    if (mode === "failure") return true;
    return false;
  };

  const isStageHighlighted = (idx: number) => {
    if (mode === "step" || mode === "play") return idx === activeStage;
    return false;
  };

  const hasFailure = (stage: RGMStageData) => mode === "failure" && !!stage.failureMode;

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Main SVG Hologram */}
      <div className="flex-1 relative rounded-lg overflow-hidden border border-panel-border bg-[hsl(220,20%,3%)]">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 bg-gradient-to-b from-background/90 to-transparent space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-primary tracking-wider uppercase">
              RGM — 9-Stage Chain Reaction
            </span>
            <ConfidenceBadgeTag confidence="VERIFIED" />
          </div>
          <HologramModeBar
            mode={mode}
            onModeChange={handleModeChange}
            currentStep={activeStage}
            totalSteps={stages.length}
            onNextStep={nextStep}
            onPrevStep={prevStep}
          />
        </div>

        <svg viewBox="0 0 420 110" className="w-full" style={{ minHeight: 340 }}>
          {/* Grid */}
          <defs>
            <pattern id="rgm-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(170,80%,50%)" strokeWidth="0.1" opacity="0.06" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="420" height="110" fill="url(#rgm-grid)" />

          {/* Connection arrows between stages */}
          {stages.slice(0, -1).map((stage, i) => {
            const next = stages[i + 1];
            const active = isStageActive(i) && isStageActive(i + 1);
            const isCurrentArrow = isStageHighlighted(i + 1);
            return (
              <g key={`arrow-${i}`}>
                <line
                  x1={stage.x + 18}
                  y1={stage.y}
                  x2={next.x - 18}
                  y2={next.y}
                  stroke={active ? stage.color : "#1a3a3a"}
                  strokeWidth={isCurrentArrow ? 1.2 : 0.4}
                  opacity={active ? 0.8 : 0.2}
                  strokeDasharray={active ? "none" : "2 1"}
                />
                {/* Animated signal dot */}
                {isCurrentArrow && (mode === "step" || mode === "play") && (
                  <circle
                    cx={stage.x + 18 + (next.x - 18 - stage.x - 18) * (0.5 + 0.3 * Math.sin(tick * 0.08))}
                    cy={stage.y}
                    r="1.5"
                    fill={next.color}
                    opacity="0.9"
                    filter="url(#glow)"
                  />
                )}
              </g>
            );
          })}

          {/* Arduino controller block */}
          <rect
            x={arduinoBlock.x - 40}
            y={arduinoBlock.y}
            width={80}
            height={14}
            rx="1.5"
            fill={arduinoBlock.color}
            fillOpacity={mode === "idle" ? 0.05 : 0.1}
            stroke={arduinoBlock.color}
            strokeWidth="0.4"
            opacity={0.5}
          />
          <text x={arduinoBlock.x} y={arduinoBlock.y + 8.5} textAnchor="middle" fill={arduinoBlock.color} fontSize="3.5" fontFamily="monospace" fontWeight="bold" opacity="0.6">
            ARDUINO MEGA (CONTROLLER)
          </text>
          {/* Lines from Arduino to stages 6,7,8,9 */}
          {[5, 6, 7, 8].map(idx => (
            <line key={`ard-${idx}`}
              x1={stages[idx].x}
              y1={stages[idx].y + 12}
              x2={Math.min(Math.max(stages[idx].x, arduinoBlock.x - 38), arduinoBlock.x + 38)}
              y2={arduinoBlock.y}
              stroke={arduinoBlock.color}
              strokeWidth="0.3"
              opacity="0.2"
              strokeDasharray="1 1"
            />
          ))}

          {/* Stage blocks */}
          {stages.map((stage, i) => {
            const active = isStageActive(i);
            const highlighted = isStageHighlighted(i);
            const failed = hasFailure(stage);
            const isSelected = selectedStage?.id === stage.id;
            const w = 30;
            const h = 20;

            // Idle ambient glow
            const idleGlow = mode === "idle" ? 0.05 + 0.03 * Math.sin((tick + i * 15) * 0.02) : 0;

            return (
              <g
                key={stage.id}
                className="cursor-pointer"
                onClick={() => setSelectedStage(isSelected ? null : stage)}
              >
                {/* Glow ring when highlighted */}
                {(highlighted || isSelected) && (
                  <rect
                    x={stage.x - w / 2 - 2}
                    y={stage.y - h / 2 - 2}
                    width={w + 4}
                    height={h + 4}
                    rx="3"
                    fill="none"
                    stroke={failed ? "hsl(var(--neon-red))" : stage.color}
                    strokeWidth="0.4"
                    opacity="0.5"
                    filter="url(#glow)"
                  />
                )}

                {/* Main block */}
                <rect
                  x={stage.x - w / 2}
                  y={stage.y - h / 2}
                  width={w}
                  height={h}
                  rx="2"
                  fill={stage.color}
                  fillOpacity={highlighted ? 0.25 : active ? 0.15 : 0.04 + idleGlow}
                  stroke={failed ? "hsl(var(--neon-red))" : stage.color}
                  strokeWidth={highlighted || isSelected ? 1 : 0.4}
                  strokeOpacity={active ? 0.9 : 0.3}
                />

                {/* Stage number badge */}
                <circle
                  cx={stage.x - w / 2 + 4}
                  cy={stage.y - h / 2 + 4}
                  r="3"
                  fill={stage.color}
                  fillOpacity={active ? 0.3 : 0.1}
                  stroke={stage.color}
                  strokeWidth="0.3"
                />
                <text x={stage.x - w / 2 + 4} y={stage.y - h / 2 + 5.5} textAnchor="middle" fill={stage.color} fontSize="3" fontFamily="monospace" fontWeight="bold">
                  {stage.id}
                </text>

                {/* Label */}
                <text x={stage.x} y={stage.y + 1} textAnchor="middle" dominantBaseline="central" fill={stage.color} fontSize="2.8" fontFamily="monospace" fontWeight="bold" opacity={active ? 1 : 0.4}>
                  {stage.shortName.split("\n").map((line, li) => (
                    <tspan key={li} x={stage.x} dy={li === 0 ? -1.5 : 3.5}>{line}</tspan>
                  ))}
                </text>

                {/* Failure indicator */}
                {failed && (
                  <>
                    <text x={stage.x} y={stage.y + h / 2 + 5} textAnchor="middle" fill="hsl(var(--neon-red))" fontSize="2.5" fontFamily="monospace" fontWeight="bold">
                      ⚠ FAILURE
                    </text>
                    {/* Red pulse */}
                    <rect
                      x={stage.x - w / 2}
                      y={stage.y - h / 2}
                      width={w}
                      height={h}
                      rx="2"
                      fill="none"
                      stroke="hsl(var(--neon-red))"
                      strokeWidth="0.6"
                      opacity={0.3 + 0.2 * Math.sin(tick * 0.06)}
                    />
                  </>
                )}

                {/* Propagation block in failure mode */}
                {mode === "failure" && stage.failureMode && (
                  <line
                    x1={stage.x + w / 2 + 2}
                    y1={stage.y}
                    x2={stage.x + w / 2 + 8}
                    y2={stage.y}
                    stroke="hsl(var(--neon-red))"
                    strokeWidth="1.5"
                    opacity={0.4 + 0.3 * Math.sin(tick * 0.05)}
                    strokeDasharray="1 1"
                  />
                )}
              </g>
            );
          })}

          {/* Flow direction label */}
          <text x="210" y="14" textAnchor="middle" fill="hsl(var(--primary))" fontSize="3" fontFamily="monospace" opacity="0.3">
            SIGNAL CHAIN: INPUT → DETECT → ACTUATE → OUTPUT
          </text>
        </svg>

        {/* Scanline */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
          <div className="absolute inset-x-0 h-px bg-primary animate-scan-line" />
        </div>

        {/* Status bar */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground bg-background/80 rounded px-2 py-0.5 border border-panel-border">
            Source: Lab_Final_Report_Amogh_Somisetty.pdf — 9-stage verified chain
          </span>
          {(mode === "step" || mode === "play") && (
            <span className="text-[10px] font-mono bg-background/80 rounded px-2 py-0.5 border" style={{ color: stages[activeStage].color, borderColor: `${stages[activeStage].color}40` }}>
              Stage {activeStage + 1}: {stages[activeStage].name}
            </span>
          )}
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="lg:w-72 panel-glass rounded-lg overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-panel-border">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
            Stage Inspector
          </span>
        </div>

        <AnimatePresence mode="wait">
          {selectedStage ? (
            <motion.div
              key={selectedStage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-3 overflow-y-auto flex-1"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{ backgroundColor: selectedStage.color + "20", color: selectedStage.color, border: `1px solid ${selectedStage.color}40` }}>
                    {selectedStage.id}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">{selectedStage.name}</h4>
                </div>
                <ConfidenceBadgeTag confidence="VERIFIED" />
              </div>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Trigger Condition</span>
                <p className="text-xs text-secondary-foreground leading-relaxed mt-0.5">{selectedStage.trigger}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Active Components</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedStage.activeComponents.map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-panel-border text-foreground">{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Output / Next-State</span>
                <p className="text-xs font-mono mt-0.5" style={{ color: selectedStage.color }}>{selectedStage.output}</p>
              </div>

              {selectedStage.failureMode && (
                <div className="border border-neon-red/20 rounded p-2 bg-neon-red/5">
                  <span className="text-[10px] font-mono text-neon-red uppercase">Known Failure</span>
                  <p className="text-xs text-secondary-foreground mt-0.5">{selectedStage.failureMode}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Cause: {selectedStage.failureCause}</p>
                </div>
              )}

              <div className="text-[10px] font-mono text-muted-foreground">
                Evidence: {selectedStage.evidenceSource}
              </div>
            </motion.div>
          ) : (mode === "step" || mode === "play") ? (
            <motion.div
              key={`auto-${activeStage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 space-y-3 overflow-y-auto flex-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
                  style={{ backgroundColor: stages[activeStage].color + "20", color: stages[activeStage].color, border: `1px solid ${stages[activeStage].color}40` }}>
                  {stages[activeStage].id}
                </span>
                <h4 className="text-sm font-semibold text-foreground">{stages[activeStage].name}</h4>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Trigger</span>
                <p className="text-xs text-secondary-foreground mt-0.5">{stages[activeStage].trigger}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Output</span>
                <p className="text-xs font-mono mt-0.5" style={{ color: stages[activeStage].color }}>{stages[activeStage].output}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {stages[activeStage].activeComponents.map((c, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-panel-border text-foreground">{c}</span>
                ))}
              </div>
            </motion.div>
          ) : mode === "failure" ? (
            <div className="p-3 space-y-2 overflow-y-auto flex-1">
              <span className="text-[10px] font-mono text-neon-red uppercase font-semibold">Failure Analysis</span>
              {stages.filter(s => s.failureMode).map(s => (
                <div key={s.id} className="border border-neon-red/20 rounded p-2 bg-neon-red/5 cursor-pointer hover:bg-neon-red/10 transition-colors" onClick={() => setSelectedStage(s)}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold" style={{ color: s.color, border: `1px solid ${s.color}40` }}>{s.id}</span>
                    <span className="text-[10px] font-mono text-neon-red font-semibold">{s.failureMode}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.failureCause}</p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground font-mono mt-2">Click a stage to see full details</p>
            </div>
          ) : (
            <div className="p-4 flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-mono text-center">
                Click a stage to inspect<br />Use mode bar for step-through or playback
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
