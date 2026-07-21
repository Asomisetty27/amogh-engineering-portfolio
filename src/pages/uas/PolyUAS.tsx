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

const MODEL_VIEWER_SRC =
  "https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

// TS/JSX shim for the custom element attributes we use.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          poster?: string;
          alt?: string;
          "camera-controls"?: boolean | string;
          "auto-rotate"?: boolean | string;
          "touch-action"?: string;
          "shadow-intensity"?: string | number;
          "environment-image"?: string;
          exposure?: string | number;
          "camera-orbit"?: string;
          "field-of-view"?: string;
          "interaction-prompt"?: string;
          reveal?: string;
          "disable-zoom"?: boolean | string;
          ar?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}

function useModelViewerScript() {
  useEffect(() => {
    if (document.querySelector(`script[data-mv="1"]`)) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = MODEL_VIEWER_SRC;
    s.async = true;
    s.dataset.mv = "1";
    document.head.appendChild(s);
  }, []);
}

// ── shared atoms ────────────────────────────────────────────────────────────
const Section: React.FC<{ id?: string; label: string; title: string; children: React.ReactNode }> = ({
  id, label, title, children,
}) => (
  <section id={id} style={{ padding: "96px 24px", borderTop: "1px solid hsl(var(--border))" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.24em",
                    textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>
        {label}
      </div>
      <h2 style={{ fontFamily: "'Clash Display', 'Space Grotesk', system-ui, sans-serif",
                   fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1, margin: 0, color: "hsl(var(--foreground))",
                   letterSpacing: "-0.02em", marginBottom: 32 }}>
        {title}
      </h2>
      {children}
    </div>
  </section>
);

const Card: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({ children, accent }) => (
  <div style={{
    background: "hsl(var(--card))",
    border: `1px solid ${accent ? "hsl(46 65% 52% / 0.35)" : "hsl(var(--border))"}`,
    borderRadius: 8, padding: 24,
    boxShadow: "inset 0 1px 0 hsl(42 40% 90% / 0.03)",
  }}>
    {children}
  </div>
);

const Kv: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, padding: "10px 0",
                borderBottom: "1px solid hsl(var(--border))" }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "hsl(var(--muted-foreground))", paddingTop: 2 }}>{k}</div>
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "hsl(var(--foreground))" }}>{v}</div>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    display: "inline-block", padding: "4px 10px", borderRadius: 999,
    border: "1px solid hsl(46 65% 52% / 0.35)", color: "hsl(46 65% 68%)",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.18em",
    textTransform: "uppercase",
  }}>{children}</span>
);

// ── page ────────────────────────────────────────────────────────────────────
export default function PolyUAS() {
  useModelViewerScript();

  return (
    <main style={{
      minHeight: "100vh",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Hero */}
      <header style={{ padding: "120px 24px 88px", borderBottom: "1px solid hsl(var(--border))" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Chip>C-UASC · CSU California UAS Competition</Chip>
            <Chip>Cal Poly · SLO</Chip>
          </div>
          <h1 style={{
            fontFamily: "'Clash Display', 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(44px, 8vw, 96px)", lineHeight: 0.98, margin: 0,
            letterSpacing: "-0.03em", color: "hsl(var(--foreground))",
          }}>
            PolyUAS
          </h1>
          <p style={{
            marginTop: 20, maxWidth: 760, fontSize: 18, lineHeight: 1.55,
            color: "hsl(var(--muted-foreground))",
          }}>
            Cal Poly's autonomous UAS program. We design, build, and fly aircraft for three
            mission capabilities: autonomous flight and navigation, vision-based target
            identification and localization, and precision package delivery.
          </p>
        </div>
      </header>

      {/* Competition */}
      <Section id="competition" label="01 · Competition" title="Three mission capabilities">
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {[
            { t: "Autonomous flight and navigation",
              d: "Waypoint execution, geofencing, and mission-planner routing on ArduPilot; RTK-corrected position, moving-baseline yaw." },
            { t: "Vision-based target ID and localization",
              d: "On-board YOLO detection on the Jetson Orin Nano; ground-plane projection from gimbal attitude and GPS to report target lat/long." },
            { t: "Precision package delivery",
              d: "Payload release timed against a computed drop point; auto-return to launch after delivery." },
          ].map((m) => (
            <Card key={m.t}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{m.t}</div>
              <div style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", lineHeight: 1.55 }}>{m.d}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Osiris */}
      <Section id="osiris" label="02 · Flagship aircraft" title="Osiris - heavy-lift autonomous quad">
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1.2fr 1fr" }}>
          <Card accent>
            <Kv k="Class" v="~12 kg AUW modular quad" />
            <Kv k="Structure" v="Aluminum plates + carbon-fiber arms; blind-mate JX4 6-pin arm connectors (CAN + PWM + 48 V)" />
            <Kv k="Propulsion" v="SIYI E6 integrated propulsion, one per arm (4 total)" />
            <Kv k="Power" v="12S ~48 V; two custom 6S4P 21700 packs (Molicel P42A / P45B); ~40 min endurance" />
            <Kv k="Compute" v="Jetson Orin Nano - YOLO detection" />
            <Kv k="Payload" v="SIYI A8 mini gimbal" />
          </Card>
          <Card>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                          textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>
              Design intent
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "hsl(var(--foreground))", margin: 0 }}>
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
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {[
            { k: "Flight controller", v: "SIYI N7 (ArduPilot, STM32H743). Not Cube Orange." },
            { k: "GPS / RTK", v: "SIYI RTK, dual-antenna moving-baseline yaw (team nickname: Seaweed). USART + I2C into the N7 GPS port." },
            { k: "Datalink", v: "SIYI HM30 - one integrated link: control + telemetry + HD video. UART to N7 TELEM, S.Bus to N7 RC IN, video over the LAN." },
            { k: "Companion", v: "Jetson Orin Nano on 12 V + Ethernet. Remote ID on CAN." },
          ].map((r) => (
            <Card key={r.k}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "hsl(46 65% 60%)", marginBottom: 8 }}>{r.k}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55 }}>{r.v}</div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Card>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                          textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>
              Bus topology
            </div>
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
        <p style={{ maxWidth: 760, color: "hsl(var(--muted-foreground))", marginTop: -12, marginBottom: 24, lineHeight: 1.6 }}>
          The electrical program (owned by Amogh Somisetty) builds the team's custom boards.
          The first is designed: a passive Arm & CAN backplane (power-dist-v1). It ingests
          48 V from the PDB, the N7 CAN bus, and N7 PWM channels 1 to 4, and lands them on
          four clean JX4 arm connectors plus a Remote-ID CAN drop, with 120 ohm bus
          termination at both ends. Four independent 48 V pass-throughs mean no single
          trace carries the full motor current.
        </p>

        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1.4fr 1fr" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>
                power-dist-v1 · interactive model
              </div>
              <Chip>Preliminary</Chip>
            </div>
            <div style={{
              width: "100%", aspectRatio: "4 / 3", background: "hsl(258 20% 4%)",
              border: "1px solid hsl(var(--border))", borderRadius: 6, overflow: "hidden", position: "relative",
            }}>
              {/* custom element loaded from CDN (see useModelViewerScript) */}
              <model-viewer
                src="/backplane.glb"
                poster="/board-3d.png"
                alt="PolyUAS Arm and CAN backplane, preliminary 3D model"
                camera-controls
                auto-rotate
                touch-action="pan-y"
                shadow-intensity="1"
                exposure="0.9"
                interaction-prompt="none"
                style={{ width: "100%", height: "100%", background: "#0a0810" }}
              />
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              Preliminary model - placeholder outline, pending the avionics-tray CAD.
            </div>
          </Card>

          <Card>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                          textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>
              Status
            </div>
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
          {[
            "Baseline aircraft flying on stock SIYI stack",
            "Arm & CAN backplane - schematic done, fabrication next",
            "Smart BMS board for the custom 6S4P packs",
            "Custom control and telemetry radio",
            "Portable ground station",
            "Swarm coordination between multiple airframes",
            "Integration and flight test toward the C-UASC competition",
          ].map((step, i) => (
            <li key={step} style={{
              display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center",
              padding: "14px 16px", background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))", borderRadius: 6,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                            letterSpacing: "0.18em", color: "hsl(46 65% 60%)" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 14 }}>{step}</div>
            </li>
          ))}
        </ol>
      </Section>

      <footer style={{ padding: "48px 24px 80px", borderTop: "1px solid hsl(var(--border))" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                      color: "hsl(var(--muted-foreground))" }}>
          PolyUAS · Cal Poly · uas.amogh.site
        </div>
      </footer>
    </main>
  );
}
