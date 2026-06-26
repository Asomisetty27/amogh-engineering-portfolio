import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";

/**
 * ⌘K command palette. A quiet "this person builds tools" signal for an
 * infra/quant audience: keyboard-first navigation, fuzzy filter, fast.
 * Sections route in-app; links open out. Pure framer-motion, no deps.
 */

type Item = {
  id: string;
  label: string;
  hint?: string;
  kind: "section" | "link";
  href?: string;
};

const ITEMS: Item[] = [
  { id: "overview", label: "Overview", hint: "Home", kind: "section" },
  { id: "projects", label: "Projects", hint: "Theta + systems", kind: "section" },
  { id: "skills", label: "Skills", kind: "section" },
  { id: "experience", label: "Experience", kind: "section" },
  { id: "quickview", label: "Quickview", hint: "Recruiter brief", kind: "section" },
  { id: "contact", label: "Contact", kind: "section" },
  { id: "theta", label: "Theta dashboard", hint: "Live", kind: "link", href: "/thermalos" },
  { id: "github", label: "GitHub · Asomisetty27/theta", kind: "link", href: "https://github.com/Asomisetty27/theta" },
  { id: "pypi", label: "PyPI · runtheta", kind: "link", href: "https://pypi.org/project/runtheta/" },
  { id: "email", label: "Email Amogh", hint: "asomisetty27@gmail.com", kind: "link", href: "mailto:asomisetty27@gmail.com" },
];

export default function CommandPalette({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ITEMS;
    return ITEMS.filter((it) => `${it.label} ${it.hint ?? ""}`.toLowerCase().includes(s));
  }, [q]);

  const run = (it?: Item) => {
    if (!it) return;
    setOpen(false);
    if (it.kind === "section") {
      onNavigate(it.id);
    } else if (it.href) {
      if (it.href.startsWith("http")) window.open(it.href, "_blank", "noopener");
      else window.location.assign(it.href);
    }
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            className="relative w-full max-w-lg overflow-hidden rounded-xl"
            style={{
              background: "linear-gradient(180deg, rgba(16,18,20,0.96) 0%, rgba(10,11,12,0.96) 100%)",
              border: "1px solid rgba(53,199,146,0.18)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(53,199,146,0.08) inset, 0 0 60px rgba(53,199,146,0.05)",
            }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 460, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <Search size={14} className="text-[#35C792]" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Jump to a section or link…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
              />
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground">ESC</span>
            </div>
            <div className="max-h-72 overflow-y-auto py-1.5">
              {results.length === 0 && (
                <div className="px-4 py-6 text-center text-xs font-mono text-muted-foreground">No matches</div>
              )}
              {results.map((it, idx) => (
                <button
                  key={it.id}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => run(it)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left transition-colors"
                  style={{ background: idx === active ? "rgba(53,199,146,0.10)" : "transparent" }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-foreground truncate">{it.label}</span>
                    {it.hint && <span className="text-[10px] font-mono text-muted-foreground truncate">{it.hint}</span>}
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      {it.kind === "link" ? "open" : "go"}
                    </span>
                    {idx === active && <CornerDownLeft size={12} className="text-[#35C792]" />}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 px-4 py-2 border-t border-white/5 text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><ArrowUp size={9} /><ArrowDown size={9} /> navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft size={9} /> select</span>
              <span className="ml-auto">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
