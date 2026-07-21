"use client";

import { useState, useEffect } from "react";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface Props {
  settings: {
    settings?: {
      title?: string;
      description?: string;
      end_date?: string;
      text_align?: string;
      background?: string;
    };
  };
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(endDate: string): TimeLeft {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ settings }: Props) {
  const s = settings.settings || {};

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    s.end_date ? calcTimeLeft(s.end_date) : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );
  const [isExpired, setIsExpired] = useState(
    s.end_date ? new Date(s.end_date).getTime() <= Date.now() : false
  );

  useEffect(() => {
    if (!s.end_date) return;
    const end = new Date(s.end_date).getTime();
    if (end <= Date.now()) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      const t = calcTimeLeft(s.end_date!);
      setTimeLeft(t);
      if (end <= Date.now()) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [s.end_date]);

  if (!s.title && !s.end_date) return null;

  const textAlign = s.text_align || "center";

  return (
    <section
      className="py-10 sm:py-16"
      style={{ background: s.background || "var(--theme-surface, #ffffff)" }}
    >
      <div
        className="mx-auto px-4 sm:px-6"
        style={{ maxWidth: "var(--theme-container-width, 1200px)", textAlign: textAlign as any }}
      >
        {hasTextValue(s.title) && (
          <EditableText
            as="h2"
            value={s.title}
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          />
        )}
        {hasTextValue(s.description) && (
          <EditableText
            as="p"
            value={s.description}
            className="text-sm mb-8"
            style={{ color: "var(--theme-text-muted)" }}
          />
        )}

        {!s.end_date ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              Aucune date de fin définie.
            </p>
          </div>
        ) : isExpired ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold" style={{ color: "var(--theme-primary)" }}>
              Offre terminée !
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {[
              { value: timeLeft.days, label: "Jours" },
              { value: timeLeft.hours, label: "Heures" },
              { value: timeLeft.minutes, label: "Minutes" },
              { value: timeLeft.seconds, label: "Secondes" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl"
                style={{
                  background: "var(--theme-surface, #ffffff)",
                  borderRadius: "var(--theme-radius-card, 12px)",
                  border: "1px solid var(--theme-border, #e5e7eb)",
                }}
              >
                <span
                  className="text-xl sm:text-2xl font-bold tabular-nums"
                  style={{
                    color: "var(--theme-primary)",
                    fontFamily: "var(--theme-font-heading)",
                  }}
                >
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
