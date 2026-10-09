import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * The portfolio: a product teardown of every project, rendered as a standalone page in
 * public/teardown/ (Three.js scene, datasheets, bench instruments). It is framed full-screen here
 * so it can own the root URL while ThermalOS, EPIC, internships and the subdomain sites keep
 * their routes in this app. Datasheet deep links pass through as #d-<ID>.
 */
const Teardown = () => {
  const { hash } = useLocation();
  const src = `/teardown/index.html${/^#d-[A-Za-z0-9]+$/.test(hash) ? hash : ""}`;

  useEffect(() => {
    const prev = document.title;
    document.title = "Amogh Somisetty";
    document.body.style.background = "#050608";
    return () => { document.title = prev; document.body.style.background = ""; };
  }, []);

  return (
    <iframe
      src={src}
      title="Amogh Somisetty, portfolio"
      allow="autoplay; fullscreen"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, background: "#050608" }}
    />
  );
};

export default Teardown;
