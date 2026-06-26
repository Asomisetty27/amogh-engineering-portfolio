import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Console easter egg — for the engineer/quant who opens devtools (they will).
// A quiet attention-to-detail signal; harmless in production.
try {
  console.log(
    "%cAmogh Somisetty %c· GPU Infrastructure & ML-Systems",
    "color:#35C792;font-weight:700;font-size:13px",
    "color:#9FE1CB;font-size:12px"
  );
  console.log(
    "%cR_θ = ΔT / P. The signal that separates a busy-hot GPU from a failing one.\nTheta: pip install runtheta · github.com/Asomisetty27/theta\nIf you read console output, we should probably talk: asomisetty27@gmail.com",
    "color:#8a8f98;font-family:ui-monospace,monospace;font-size:11px;line-height:1.6"
  );
} catch {
  /* no-op */
}

createRoot(document.getElementById("root")!).render(<App />);
