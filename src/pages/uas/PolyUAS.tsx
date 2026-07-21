import { useEffect } from "react";

/**
 * PolyUAS - Cal Poly's autonomous UAS program for the CSU California UAS
 * Competition (C-UASC). Additive surface, hostname-routed at uas.amogh.site
 * (and /uas on the primary domain), styled to the Isotherm system: obsidian +
 * warm ivory, champagne as the single accent, instrument language, restraint.
 *
 * The 3D backplane viewer uses Google's <model-viewer> loaded from a CDN
 * script tag (NOT npm), keeping design:verify G5 bundle budgets intact.
 */

const MV = "https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

// TS/JSX shim for the custom element.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}

function useMV() {
  useEffect(() => {
    if (document.querySelector(`script[data-mv="1"]`)) return;
    const s = document.createElement("script");
    s.type = "module"; s.src = MV; s.async = true; s.dataset.mv = "1";
    document.head.appendChild(s);
  }, []);
}

// ── shared style tokens (extracted so gzip can dedupe) ──────────────────────
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISPLAY = "'Clash Display', 'Space Grotesk', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "1px solid hsl(var(--border))";
const CARD_BG = "hsl(var(--card))";
const GOLD = "hsl(46 65% 60%)";
const WRAP: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };
const GRID: React.CSSProperties = { display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" };
const GRID_LG: React.CSSProperties = { display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" };
const LABEL: React.CSSProperties = {
  fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em",
  textTransform: "uppercase", color: MUTED,
};

// ── atoms ───────────────────────────────────────────────────────────────────
const Section: React.FC<{ id?: string; label: string; title: string; children: React.ReactNode }> = ({
  id, label, title, children,
}) => (
  <section id={id} style={{ padding: "96px 24px", borderTop: BORDER }}>
    <div style={WRAP}>
      <div style={{ ...LABEL, fontSize: 11, letterSpacing: "0.24em", marginBottom: 12 }}>{label}</div>
      <h2 style={{
        fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1,
        margin: 0, color: FG, letterSpacing: "-0.02em", marginBottom: 32,
      }}>{title}</h2>
      {children}
    </div>
  </section>
);

const Card: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({ children, accent }) => (
  <div style={{
    background: CARD_BG,
    border: `1px solid ${accent ? "hsl(46 65% 52% / 0.35)" : "hsl(var(--border))"}`,
    borderRadius: 8, padding: 24,
    boxShadow: "inset 0 1px 0 hsl(42 40% 90% / 0.03)",
  }}>{children}</div>
);

const Kv: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "140px 1fr", gap: 16,
    padding: "10px 0", borderBottom: BORDER,
  }}>
    <div style={{ ...LABEL, paddingTop: 2 }}>{k}</div>
    <div style={{ fontFamily: BODY, fontSize: 14, color: FG }}>{v}</div>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    display: "inline-block", padding: "4px 10px", borderRadius: 999,
    border: "1px solid hsl(46 65% 52% / 0.35)", color: GOLD,
    fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
  }}>{children}</span>
);

// ── content ─────────────────────────────────────────────────────────────────
const MISSIONS = [
  ["Autonomous flight and navigation",
   "Waypoint execution, geofencing, and mission-planner routing on ArduPilot; RTK-corrected position, moving-baseline yaw."],
  ["Vision-based target ID and localization",
   "On-board YOLO detection on the Jetson Orin Nano; ground-plane projection from gimbal attitude and GPS to report target lat/long."],
  ["Precision package delivery",
   "Payload release timed against a computed drop point; auto-return to launch after delivery."],
] as const;

const AVIONICS = [
  ["Flight controller", "SIYI N7 (ArduPilot, STM32H743). Not Cube Orange."],
  ["GPS / RTK", "SIYI RTK, dual-antenna moving-baseline yaw (team nickname: Seaweed). USART + I2C into the N7 GPS port."],
  ["Datalink", "SIYI HM30 - one integrated link: control + telemetry + HD video. UART to N7 TELEM, S.Bus to N7 RC IN, video over the LAN."],
  ["Companion", "Jetson Orin Nano on 12 V + Ethernet. Remote ID on CAN."],
] as const;

const ROADMAP = [
  "Baseline aircraft flying on stock SIYI stack",
  "Arm & CAN backplane - schematic done, fabrication next",
  "Smart BMS board for the custom 6S4P packs",
  "Custom control and telemetry radio",
  "Portable ground station",
  "Swarm coordination between multiple airframes",
  "Integration and flight test toward the C-UASC competition",
];

// ── page ────────────────────────────────────────────────────────────────────
export default function PolyUAS() {
  useMV();

  return (
    <main style={{ minHeight: "100vh", background: "hsl(var(--background))", color: FG, fontFamily: BODY }}>
      {/* Hero */}
      <header style={{ padding: "120px 24px 88px", borderBottom: BORDER }}>
        <div style={WRAP}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            <Chip>C-UASC · CSU California UAS Competition</Chip>
            <Chip>Cal Poly · SLO</Chip>
          </div>
          <h1 style={{
            fontFamily: DISPLAY, fontSize: "clamp(44px, 8vw, 96px)", lineHeight: 0.98,
            margin: 0, letterSpacing: "-0.03em", color: FG,
          }}>PolyUAS</h1>
          <p style={{ marginTop: 20, maxWidth: 760, fontSize: 18, lineHeight: 1.55, color: MUTED }}>
            Cal Poly's autonomous UAS program. We design, build, and fly aircraft for three
            mission capabilities: autonomous flight and navigation, vision-based target
            identification and localization, and precision package delivery.
          </p>
        </div>
      </header>

      {/* Competition */}
      <Section id="competition" label="01 · Competition" title="Three mission capabilities">
        <div style={GRID}>
          {MISSIONS.map(([t, d]) => (
            <Card key={t}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55 }}>{d}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Osiris */}
      <Section id="osiris" label="02 · Flagship aircraft" title="Osiris - heavy-lift autonomous quad">
        <div style={GRID_LG}>
          <Card accent>
            <Kv k="Class" v="~12 kg AUW modular quad" />
            <Kv k="Structure" v="Aluminum plates + carbon-fiber arms; blind-mate JX4 6-pin arm connectors (CAN + PWM + 48 V)" />
            <Kv k="Propulsion" v="SIYI E6 integrated propulsion, one per arm (4 total)" />
            <Kv k="Power" v="12S ~48 V; two custom 6S4P 21700 packs (Molicel P42A / P45B); ~40 min endurance" />
            <Kv k="Compute" v="Jetson Orin Nano - YOLO detection" />
            <Kv k="Payload" v="SIYI A8 mini gimbal" />
          </Card>
          <Card>
            <div style={{ ...LABEL, marginBottom: 12 }}>Design intent</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: FG, margin: 0 }}>
              Modular airframe: each arm is a self-contained unit that carries its own motor
              power and signal on a single blind-mate connector. Swap an arm on the field
              without unsoldering. Four independent 48 V feeds mean no single trace ever
              carries the full motor current.
            </p>
          </Card>
        </div>
      </Section>

      {/* Avionics */}
      <Section id="avionics" label="03 · Avionics" title="All-SIYI, bus-based architecture">
        <div style={GRID}>
          {AVIONICS.map(([k, v]) => (
            <Card key={k}>
              <div style={{ ...LABEL, color: GOLD, marginBottom: 8 }}>{k}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55 }}>{v}</div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Card>
            <div style={{ ...LABEL, marginBottom: 12 }}>Bus topology</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
              <li>One DroneCAN bus: 4x E6 motors + Remote ID + N7.</li>
              <li>One Ethernet LAN: A8 gimbal + Jetson + HM30.</li>
              <li>SmartAP PDB: 48 V to motors; 12 V and 5 V to avionics.</li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* EE program + 3D board */}
      <Section id="ee" label="04 · Electrical program" title="Custom boards - starting with Arm & CAN backplane">
        <p style={{ maxWidth: 760, color: MUTED, marginTop: -12, marginBottom: 24, lineHeight: 1.6 }}>
          The electrical program (owned by Amogh Somisetty) builds the team's custom boards.
          The first is designed: a passive Arm & CAN backplane (power-dist-v1). It ingests
          48 V from the PDB, the N7 CAN bus, and N7 PWM channels 1 to 4, and lands them on
          four clean JX4 arm connectors plus a Remote-ID CAN drop, with 120 ohm bus
          termination at both ends. Four independent 48 V pass-throughs mean no single
          trace carries the full motor current.
        </p>
        <div style={GRID_LG}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={LABEL}>power-dist-v1 · interactive model</div>
              <Chip>Preliminary</Chip>
            </div>
            <div style={{
              width: "100%", aspectRatio: "4 / 3", background: "hsl(258 20% 4%)",
              border: BORDER, borderRadius: 6, overflow: "hidden", position: "relative",
            }}>
              {/* custom element loaded from CDN via useMV(); until it upgrades,
                  the browser renders it as an unknown element with the poster
                  visible as a normal img fallback below. */}
              <model-viewer
                src="/backplane.glb"
                poster="/board-3d.png"
                alt="PolyUAS Arm and CAN backplane, preliminary 3D model"
                camera-controls=""
                auto-rotate=""
                touch-action="pan-y"
                shadow-intensity="1"
                exposure="0.9"
                interaction-prompt="none"
                style={{ width: "100%", height: "100%", background: "#0a0810", display: "block" }}
              >
                <img
                  slot="poster"
                  src="/board-3d.png"
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </model-viewer>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: MUTED }}>
              Preliminary model - placeholder outline, pending the avionics-tray CAD.
            </div>
          </Card>
          <Card>
            <div style={{ ...LABEL, marginBottom: 12 }}>Status</div>
            <Kv k="Schematic" v="Captured" />
            <Kv k="ERC" v="Clean (0 violations)" />
            <Kv k="Netlist" v="Verified against N7 pinout" />
            <Kv k="Termination" v="120 Ω at both bus ends" />
            <Kv k="Power" v="4x independent 48 V arm feeds" />
          </Card>
        </div>
      </Section>

      {/* Roadmap */}
      <Section id="roadmap" label="05 · Roadmap" title="Fly on proven parts, layer custom EE work in">
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
          {ROADMAP.map((step, i) => (
            <li key={step} style={{
              display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center",
              padding: "14px 16px", background: CARD_BG, border: BORDER, borderRadius: 6,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: GOLD }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 14 }}>{step}</div>
            </li>
          ))}
        </ol>
      </Section>

      <footer style={{ padding: "48px 24px 80px", borderTop: BORDER }}>
        <div style={{ ...WRAP, ...LABEL, fontSize: 11, letterSpacing: "0.18em" }}>
          PolyUAS · Cal Poly · uas.amogh.site
        </div>
      </footer>
    </main>
  );
}
