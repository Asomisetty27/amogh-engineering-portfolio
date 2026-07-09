import { motion } from "framer-motion";
import { personalInfo } from "@/data/portfolioData";
import { SectionTitle } from "@/components/ui/mission-ui";
import { Mail, Phone, Copy, Check, Github, Package, ExternalLink, FileText, Linkedin } from "lucide-react";
import { useState } from "react";

export default function ContactSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="max-w-lg mx-auto">
      <SectionTitle>Contact</SectionTitle>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1.0] }}
        className="fx-glass rounded-lg p-6 space-y-4 relative overflow-hidden"
      >
        {/* Subtle accent glow at top */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(ellipse 60% 100% at 50% 0%, hsl(var(--primary) / 0.10), transparent)",
          }}
        />

        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))",
                border: "1px solid hsl(var(--primary) / 0.18)",
              }}>
              <Mail size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">Email</p>
              <a
                href={`mailto:${personalInfo.email}`}
                className="text-sm text-foreground hover:text-primary transition-colors"
              >
                {personalInfo.email}
              </a>
            </div>
          </div>
          <button
            onClick={() => copy(personalInfo.email, "email")}
            className="p-2 rounded-md hover:bg-panel-highlight transition-all text-muted-foreground hover:text-foreground hover:scale-105"
          >
            {copied === "email" ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />

        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))",
                border: "1px solid hsl(var(--primary) / 0.18)",
              }}>
              <Phone size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">Phone</p>
              <a
                href={`tel:${personalInfo.phone}`}
                className="text-sm text-foreground hover:text-primary transition-colors"
              >
                {personalInfo.phone}
              </a>
            </div>
          </div>
          <button
            onClick={() => copy(personalInfo.phone, "phone")}
            className="p-2 rounded-md hover:bg-panel-highlight transition-all text-muted-foreground hover:text-foreground hover:scale-105"
          >
            {copied === "phone" ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />

        <div className="space-y-3 relative">
          {[
            { Icon: Github, label: "GitHub", value: "github.com/Asomisetty27", href: "https://github.com/Asomisetty27" },
            { Icon: Package, label: "PyPI", value: "pip install runtheta", href: "https://pypi.org/project/runtheta/" },
            { Icon: ExternalLink, label: "Live dashboard", value: "amogh.site/thermalos", href: "/thermalos" },
            { Icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/amoghsomisetty", href: "https://linkedin.com/in/amoghsomisetty" },
            { Icon: FileText, label: "Resume (PDF)", value: "Fall 2026 — GPU / ML hardware", href: "/Amogh_Somisetty_Resume_Fall2026.pdf" },
          ].map(({ Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="flex items-center gap-3 group"
            >
              <div
                className="p-2 rounded-md"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))",
                  border: "1px solid hsl(var(--primary) / 0.18)",
                }}
              >
                <Icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">{label}</p>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">{value}</span>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
