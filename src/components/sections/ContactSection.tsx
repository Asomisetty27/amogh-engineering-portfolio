import { motion } from "framer-motion";
import { personalInfo } from "@/data/portfolioData";
import { SectionTitle } from "@/components/ui/mission-ui";
import { Mail, Phone, Copy, Check } from "lucide-react";
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel-glass rounded-lg p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-primary" />
            <div>
              <p className="text-xs font-mono text-muted-foreground">Email</p>
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
            className="p-1.5 rounded hover:bg-panel-highlight transition-colors text-muted-foreground"
          >
            {copied === "email" ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="h-px bg-panel-border" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-primary" />
            <div>
              <p className="text-xs font-mono text-muted-foreground">Phone</p>
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
            className="p-1.5 rounded hover:bg-panel-highlight transition-colors text-muted-foreground"
          >
            {copied === "phone" ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
