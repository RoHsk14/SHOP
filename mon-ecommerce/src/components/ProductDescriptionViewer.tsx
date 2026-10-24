"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Cog,
  Clock,
  HeartHandshake,
  ShieldCheck,
  ChevronDown,
  Info,
} from "lucide-react";

interface Props {
  description?: string | null;
  mode?: "full" | "accordion" | "tabs";
  title?: string;
  className?: string;
}

interface ParsedSection {
  title?: string;
  paragraphs: string[];
  bullets: string[];
  steps: { label: string; text: string }[];
}

export default function ProductDescriptionViewer({
  description,
  mode = "full",
  title = "Description du produit",
  className = "",
}: Props) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    desc: true,
    benefits: true,
    usage: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isHtml = useMemo(() => {
    if (!description) return false;
    return /<[a-z][\s\S]*>/i.test(description);
  }, [description]);

  // Clean and parse unformatted plain text into structured visual sections
  const parsedSections = useMemo(() => {
    if (!description || isHtml) return [];

    // Strip incoming raw emojis to maintain professional design
    const cleaned = description
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    const sections: ParsedSection[] = [];
    const rawParagraphs = cleaned.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    // If single large paragraph, try to break on questions
    const blocks: string[] = [];
    rawParagraphs.forEach((para) => {
      if (para.length > 250 && para.includes("?")) {
        const parts = para.split(/(?<=\?)\s+(?=[A-ZÀ-Ÿ])/);
        blocks.push(...parts);
      } else {
        blocks.push(para);
      }
    });

    let currentSection: ParsedSection = {
      paragraphs: [],
      bullets: [],
      steps: [],
    };

    blocks.forEach((block) => {
      const isQuestionHeading =
        /^(Pourquoi|Ce que|Comment|À quoi|Quels|Pour qui|Résultats|Bénéfices|Utilisation|Ingrédients)/i.test(block) ||
        (block.length < 80 && block.endsWith("?"));

      if (isQuestionHeading) {
        if (
          currentSection.paragraphs.length > 0 ||
          currentSection.bullets.length > 0 ||
          currentSection.steps.length > 0
        ) {
          sections.push(currentSection);
        }
        currentSection = {
          title: block.replace(/[\?\:\.]+$/, "").trim() + " ?",
          paragraphs: [],
          bullets: [],
          steps: [],
        };
        return;
      }

      // Check for bullet lines
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const isBulletList = lines.some((l) => /^[•\-\*✓\+]/.test(l));

      if (isBulletList) {
        lines.forEach((line) => {
          const cleanLine = line.replace(/^[•\-\*✓\+]\s*/, "").trim();
          if (cleanLine) currentSection.bullets.push(cleanLine);
        });
      } else if (
        /^(Durée|Prise|Posologie|Matin|Soir|Ensuite|Étape)\s*:/i.test(block) ||
        lines.some((l) => /^[A-Z][a-z]+\s*:\s*/.test(l))
      ) {
        lines.forEach((line) => {
          const match = line.match(/^([^:]+):\s*(.*)$/);
          if (match) {
            currentSection.steps.push({
              label: match[1].trim(),
              text: match[2].trim(),
            });
          } else {
            currentSection.paragraphs.push(line);
          }
        });
      } else {
        currentSection.paragraphs.push(block);
      }
    });

    if (
      currentSection.paragraphs.length > 0 ||
      currentSection.bullets.length > 0 ||
      currentSection.steps.length > 0
    ) {
      sections.push(currentSection);
    }

    return sections;
  }, [description, isHtml]);

  if (!description) return null;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* If description is rich HTML, render with high-end prose and styling */}
      {isHtml ? (
        <div
          className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : parsedSections.length > 0 ? (
        /* Structured visual layout for plain text descriptions */
        <div className="space-y-6">
          {parsedSections.map((sec, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-4 transition-all hover:border-gray-300"
            >
              {sec.title && (
                <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                  <span className="w-2 h-5 rounded-full bg-emerald-600 shrink-0 inline-block" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    {sec.title}
                  </h3>
                </div>
              )}

              {/* Regular Paragraphs */}
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}

              {/* Bullet Benefits Grid */}
              {sec.bullets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {sec.bullets.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/70"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 leading-snug">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Usage & Steps Timeline */}
              {sec.steps.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {sec.steps.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-center"
                    >
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                        {s.label}
                      </span>
                      <p className="text-xs font-semibold text-gray-800 leading-snug">
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {description}
        </div>
      )}
    </div>
  );
}
