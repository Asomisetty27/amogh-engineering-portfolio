import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfidenceBadgeTag } from "@/components/ui/mission-ui";

interface DatapathBlock {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  description: string;
  signals: string[];
  evidenceSource: string;
}

const blocks: DatapathBlock[] = [
  { id: "pc", name: "Program Counter", shortName: "PC", x: 5, y: 40, w: 12, h: 10, color: "#00d4aa", description: "Holds address of current instruction. Supports 4 sources via pcSource MUX: PC+4, jalr, branch, jal.", signals: ["pcSource[1:0]", "PCWrite", "PC+4", "pc_out"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "imem", name: "Instruction Memory", shortName: "IMEM", x: 20, y: 40, w: 14, h: 10, color: "#44aaff", description: "Stores program instructions. Port 1 addressed by PC. Output is 32-bit instruction register (IR).", signals: ["ADDR1=PC", "RDEN1", "ir[31:0]"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "rf", name: "Register File", shortName: "RF\n32×32", x: 38, y: 25, w: 14, h: 15, color: "#ff4488", description: "32 general-purpose 32-bit registers. Dual-read ports (rs1, rs2), single write port with rf_wr_sel MUX (3 sources: PC+4, CSR_reg, DOUT2).", signals: ["rs1, rs2 (read)", "rd (write)", "rf_wr_sel[1:0]", "RegWrite"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "alu", name: "ALU", shortName: "ALU", x: 58, y: 30, w: 12, h: 12, color: "#ffaa00", description: "10 operations: add, sub, and, or, xor, slt, sltu, sra, sll, lui-copy. Function selected by 4-bit alu_fun from CU_DCDR.", signals: ["alu_fun[3:0]", "srcA (rs1)", "srcB (rs2/imm)", "alu_result"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "immgen", name: "Immediate Generator", shortName: "IMM\nGEN", x: 38, y: 55, w: 14, h: 10, color: "#00ffcc", description: "Decodes ir[31:7] into I, S, B, U, J type immediates for ALU source B.", signals: ["ir[31:7]", "I/S/B/U/J type output"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "branch", name: "Branch Condition Gen", shortName: "BRANCH\nCOND", x: 58, y: 55, w: 12, h: 10, color: "#ff6644", description: "Compares rs1 and rs2 to generate branch condition flags.", signals: ["br_eq", "br_lt", "br_ltu"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "cu_fsm", name: "Control Unit FSM", shortName: "CU\nFSM", x: 78, y: 15, w: 14, h: 10, color: "#aa44ff", description: "Two-state FSM: FETCH (assert memRDEN1, load IR) → EXEC (decode opcode, assert signals, write results).", signals: ["FETCH", "EXEC", "PCWrite", "RegWrite", "memWE2"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "cu_dcdr", name: "Control Unit Decoder", shortName: "CU\nDCDR", x: 78, y: 35, w: 14, h: 10, color: "#aa44ff", description: "Decodes opcode bits [30,14:12,6:0] into control signals for ALU, MUXes, and memory.", signals: ["alu_fun[3:0]", "alu_srcA", "alu_srcB", "pcSource", "rf_wr_sel"], evidenceSource: "OTTER_Architecture, p1" },
  { id: "mem", name: "Memory", shortName: "MEM", x: 78, y: 55, w: 14, h: 12, color: "#44aaff", description: "Dual-port: ADDR1=PC (instruction fetch), ADDR2=ALU result (data). Supports byte/half/word access.", signals: ["ADDR2=ALU result", "RDEN2", "WE2", "SIZE", "SIGN", "DOUT2"], evidenceSource: "OTTER_Architecture, p1" },
];

export default function OtterInteractive() {
  const [selected, setSelected] = useState<DatapathBlock | null>(null);

  return (
    <div className="flex flex-col lg:flex-row gap-3" style={{ minHeight: 450 }}>
      {/* Interactive Datapath */}
      <div className="flex-1 relative rounded-lg overflow-hidden border border-panel-border bg-[hsl(220,20%,3%)]">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-background/90 to-transparent">
          <span className="text-xs font-mono font-semibold text-primary tracking-wider uppercase">OTTER MCU — Interactive System View</span>
          <ConfidenceBadgeTag confidence="VERIFIED" />
        </div>

        {/* SVG Datapath */}
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ minHeight: 400 }}>
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(170,80%,50%)" strokeWidth="0.05" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100" height="80" fill="url(#grid)" />

          {/* Connection lines */}
          <line x1="17" y1="45" x2="20" y2="45" stroke="#00d4aa" strokeWidth="0.3" opacity="0.4" />
          <line x1="34" y1="45" x2="38" y2="35" stroke="#44aaff" strokeWidth="0.3" opacity="0.4" />
          <line x1="52" y1="32" x2="58" y2="36" stroke="#ff4488" strokeWidth="0.3" opacity="0.4" />
          <line x1="45" y1="55" x2="58" y2="42" stroke="#00ffcc" strokeWidth="0.3" opacity="0.4" />
          <line x1="70" y1="36" x2="78" y2="36" stroke="#ffaa00" strokeWidth="0.3" opacity="0.4" />

          {/* Blocks */}
          {blocks.map((block) => {
            const isSelected = selected?.id === block.id;
            return (
              <g
                key={block.id}
                onClick={() => setSelected(isSelected ? null : block)}
                className="cursor-pointer"
              >
                <rect
                  x={block.x}
                  y={block.y}
                  width={block.w}
                  height={block.h}
                  rx="0.8"
                  fill={block.color}
                  fillOpacity={isSelected ? 0.3 : 0.1}
                  stroke={block.color}
                  strokeWidth={isSelected ? 0.6 : 0.3}
                  strokeOpacity={isSelected ? 1 : 0.6}
                />
                {/* Glow */}
                {isSelected && (
                  <rect
                    x={block.x - 0.5}
                    y={block.y - 0.5}
                    width={block.w + 1}
                    height={block.h + 1}
                    rx="1"
                    fill="none"
                    stroke={block.color}
                    strokeWidth="0.2"
                    opacity="0.4"
                  />
                )}
                <text
                  x={block.x + block.w / 2}
                  y={block.y + block.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={block.color}
                  fontSize="2.2"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {block.shortName.split("\n").map((line, i) => (
                    <tspan key={i} x={block.x + block.w / 2} dy={i === 0 ? 0 : 2.5}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* Title */}
          <text x="50" y="5" textAnchor="middle" fill="#00d4aa" fontSize="2" fontFamily="monospace" opacity="0.5">
            FETCH → EXEC (2-cycle FSM)
          </text>
        </svg>

        {/* Scanline */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
          <div className="absolute inset-x-0 h-px bg-primary animate-scan-line" />
        </div>
      </div>

      {/* Block Inspector */}
      <div className="lg:w-72 panel-glass rounded-lg overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-panel-border">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
            Block Inspection
          </span>
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-3 overflow-y-auto flex-1"
            >
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1" style={{ color: selected.color }}>
                  {selected.name}
                </h4>
                <ConfidenceBadgeTag confidence="VERIFIED" />
              </div>

              <p className="text-xs text-secondary-foreground leading-relaxed">{selected.description}</p>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Signals</span>
                <div className="mt-1 space-y-0.5">
                  {selected.signals.map((s, i) => (
                    <div key={i} className="text-xs font-mono text-primary/80">{s}</div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] font-mono text-muted-foreground">
                Source: {selected.evidenceSource}
              </div>
            </motion.div>
          ) : (
            <div className="p-4 flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-mono text-center">
                Click a block to inspect
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
