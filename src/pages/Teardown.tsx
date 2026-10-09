import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * The portfolio is the static teardown page in public/teardown/ (Three.js scene, datasheets,
 * bench instruments). index.html already sends portfolio URLs there before the app loads; this
 * route covers in-app navigation to "/" or an old portfolio URL. It redirects rather than framing
 * the page, because framing it broke the scene's lighting on phones.
 */
const Teardown = () => {
  const { hash } = useLocation();

  useEffect(() => {
    const keep = /^#d-[A-Za-z0-9]+$/.test(hash) ? hash : "";
    window.location.replace(`/teardown/${keep}`);
  }, [hash]);

  return <div style={{ position: "fixed", inset: 0, background: "#050608" }} />;
};

export default Teardown;
