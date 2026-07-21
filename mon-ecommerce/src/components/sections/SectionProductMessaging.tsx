"use client";

import { Truck, CreditCard, RefreshCw, Shield } from "lucide-react";

interface Props {
  settings?: {
    show_delivery?: boolean;
    delivery_text?: string;
    show_payment?: boolean;
    payment_text?: string;
    show_returns?: boolean;
    returns_text?: string;
    show_guarantee?: boolean;
    guarantee_text?: string;
    layout?: "row" | "column" | "grid";
  };
}

const iconMap: Record<string, React.ReactNode> = {
  delivery: <Truck className="w-5 h-5" />,
  payment: <CreditCard className="w-5 h-5" />,
  returns: <RefreshCw className="w-5 h-5" />,
  guarantee: <Shield className="w-5 h-5" />,
};

export default function SectionProductMessaging({ settings }: Props) {
  const showDelivery = settings?.show_delivery !== false;
  const showPayment = settings?.show_payment !== false;
  const showReturns = settings?.show_returns !== false;
  const showGuarantee = settings?.show_guarantee;
  const layout = settings?.layout || "row";

  const items: { key: string; icon: React.ReactNode; text: string }[] = [];
  if (showDelivery) items.push({ key: "delivery", icon: iconMap.delivery, text: settings?.delivery_text || "" });
  if (showPayment) items.push({ key: "payment", icon: iconMap.payment, text: settings?.payment_text || "" });
  if (showReturns) items.push({ key: "returns", icon: iconMap.returns, text: settings?.returns_text || "" });
  if (showGuarantee) items.push({ key: "guarantee", icon: iconMap.guarantee, text: settings?.guarantee_text || "" });

  if (!items.length) return null;

  const containerClass = layout === "column"
    ? "flex flex-col gap-3"
    : layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
      : "flex flex-wrap gap-3";

  return (
    <div className="mx-auto px-4 sm:px-6 pb-6 sm:pb-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div
        className={`p-4 sm:p-6 ${containerClass}`}
        style={{
          background: "var(--theme-surface, #ffffff)",
          borderRadius: "var(--theme-radius-card, 16px)",
          border: "1px solid var(--theme-border, #e5e7eb)",
        }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 text-sm"
            style={{ color: "var(--theme-text-muted, #6b7280)" }}
          >
            <span className="shrink-0" style={{ color: "var(--theme-primary, #059669)" }}>
              {item.icon}
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
