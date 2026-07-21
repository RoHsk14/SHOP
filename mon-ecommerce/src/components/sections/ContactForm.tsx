"use client";

import { useState } from "react";
import { toast } from "sonner";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface FormFields {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type FormStatus = "idle" | "sending" | "sent" | "error";

interface Props {
  settings: {
    title?: string;
    description?: string;
    email?: string;
    show_name?: boolean;
    show_phone?: boolean;
    show_subject?: boolean;
    button_text?: string;
    success_message?: string;
  };
}

export default function ContactForm({ settings }: Props) {
  const resolved = (settings as any).settings || settings;

  const [form, setForm] = useState<FormFields>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleChange = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.trim() || !form.message.trim()) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }

    if (resolved.show_name && !form.name.trim()) {
      toast.error("Veuillez saisir votre nom.");
      return;
    }

    setStatus("sending");

    setTimeout(() => {
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success(resolved.success_message || "Message envoyé avec succès !");
    }, 800);
  };

  return (
    <section className="py-10 sm:py-16">
      <div
        className="mx-auto px-4 sm:px-6"
        style={{ maxWidth: "var(--theme-container-width, 1200px)" }}
      >
        {hasTextValue(resolved.title) && (
          <EditableText
            as="h2"
            value={resolved.title}
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          />
        )}
        {hasTextValue(resolved.description) && (
          <EditableText
            as="p"
            value={resolved.description}
            className="text-center text-sm mb-8"
            style={{ color: "var(--theme-text-muted)" }}
          />
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto space-y-4"
          noValidate
        >
          {resolved.show_name && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--theme-text)" }}
              >
                Nom <span style={{ color: "var(--theme-primary)" }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Votre nom"
                className="w-full text-sm px-4 py-2.5"
                style={{
                  background: "var(--theme-surface)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "var(--theme-radius-input)",
                  color: "var(--theme-text)",
                  outline: "none",
                }}
              />
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--theme-text)" }}
            >
              Email <span style={{ color: "var(--theme-primary)" }}>*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Votre email"
              required
              className="w-full text-sm px-4 py-2.5"
              style={{
                background: "var(--theme-surface)",
                border: "1px solid var(--theme-border)",
                borderRadius: "var(--theme-radius-input)",
                color: "var(--theme-text)",
                outline: "none",
              }}
            />
          </div>

          {resolved.show_phone && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--theme-text)" }}
              >
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Votre téléphone"
                className="w-full text-sm px-4 py-2.5"
                style={{
                  background: "var(--theme-surface)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "var(--theme-radius-input)",
                  color: "var(--theme-text)",
                  outline: "none",
                }}
              />
            </div>
          )}

          {resolved.show_subject && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--theme-text)" }}
              >
                Sujet
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Sujet de votre message"
                className="w-full text-sm px-4 py-2.5"
                style={{
                  background: "var(--theme-surface)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "var(--theme-radius-input)",
                  color: "var(--theme-text)",
                  outline: "none",
                }}
              />
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--theme-text)" }}
            >
              Message <span style={{ color: "var(--theme-primary)" }}>*</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Votre message"
              required
              rows={5}
              className="w-full text-sm px-4 py-2.5 resize-y"
              style={{
                background: "var(--theme-surface)",
                border: "1px solid var(--theme-border)",
                borderRadius: "var(--theme-radius-input)",
                color: "var(--theme-text)",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="w-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "var(--theme-primary)",
              borderRadius: "var(--theme-radius-button)",
            }}
          >
            {status === "sending"
              ? "Envoi en cours..."
              : status === "sent"
              ? "Envoyé !"
              : <EditableText as="span" value={resolved.button_text} fallback="Envoyer" />}
          </button>
        </form>
      </div>
    </section>
  );
}
