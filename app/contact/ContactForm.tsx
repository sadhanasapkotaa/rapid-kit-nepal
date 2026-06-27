"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "success" | "error";

const topicOptions = [
  { value: "quote", label: "Bulk quote" },
  { value: "custom", label: "Custom kit configuration" },
  { value: "distribution", label: "Becoming a distributor" },
  { value: "support", label: "Product support" },
];

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      console.error(
        "EmailJS is not configured. Set NEXT_PUBLIC_EMAILJS_SERVICE_ID, " +
          "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY.",
      );
      setStatus("error");
      return;
    }

    // Capture field values before form.reset() clears them, so we can persist
    // to Supabase regardless of the EmailJS outcome.
    const fd = new FormData(form);
    const messageRow = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      organization: (fd.get("organization") as string) || null,
      phone: (fd.get("phone") as string) || null,
      topic: String(fd.get("topic") ?? ""),
      message: String(fd.get("message") ?? ""),
    };

    setStatus("submitting");
    try {
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, {
        publicKey: PUBLIC_KEY,
      });
      setStatus("success");
      form.reset();
    } catch (error) {
      console.error("Failed to send contact message", error);
      setStatus("error");
    }

    // Persist to Supabase independently. A DB failure must never affect the
    // EmailJS-driven success/error UX above email is the source of truth.
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("contact_messages")
        .insert(messageRow);
      if (dbError) {
        console.error("Failed to persist contact message", dbError);
      }
    } catch (dbError) {
      console.error("Failed to persist contact message", dbError);
    }
  }

  if (status === "success") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-12">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/5" />
        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h3 className="mt-5 text-xl font-semibold text-foreground">
            Message sent
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Thanks for reaching out. A specialist from our team will reply
            within one business day.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary-dark"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      <div className="relative border-b border-border bg-linear-to-br from-muted via-white to-white px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Send us a message
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Average response time: under 4 hours, Mon–Sat.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-7 sm:px-8">
        <fieldset className="space-y-5">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            About you
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldWithIcon
              id="name"
              name="name"
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="Dr. Aisha Khan"
              required
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <FieldWithIcon
              id="email"
              name="email"
              label="Work email"
              type="email"
              autoComplete="email"
              placeholder="you@clinic.org"
              required
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldWithIcon
              id="organization"
              name="organization"
              label="Organisation"
              hint="Optional"
              type="text"
              autoComplete="organization"
              placeholder="City Health Foundation"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                </svg>
              }
            />
            <FieldWithIcon
              id="phone"
              name="phone"
              label="Phone"
              hint="Optional"
              type="tel"
              autoComplete="tel"
              placeholder="+977-9866293083"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            />
          </div>
        </fieldset>

        <div className="h-px bg-border" />

        <fieldset className="space-y-5">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            How can we help?
          </legend>

          <div>
            <label className="block text-sm font-medium text-foreground">
              I&apos;m interested in
            </label>
            <div
              role="radiogroup"
              className="mt-2 grid gap-2 sm:grid-cols-2"
            >
              {topicOptions.map((opt, i) => (
                <label
                  key={opt.value}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground transition-colors has-checked:border-primary has-checked:bg-primary/5 hover:border-primary/60"
                >
                  <input
                    type="radio"
                    name="topic"
                    value={opt.value}
                    defaultChecked={i === 0}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-foreground"
              >
                Message
              </label>
              <span className="text-xs text-slate-500">
                Include kits, quantities, timelines
              </span>
            </div>
            <textarea
              required
              id="message"
              name="message"
              rows={5}
              className="mt-1.5 w-full resize-y rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Hi KitHouse team we&apos;re a 40-bed clinic in Pune looking to standardise our maternal-care kits…"
            />
          </div>
        </fieldset>

        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span>
              Something went wrong while sending your message. Please try again,
              or email us directly at{" "}
              <a
                href="mailto:rapidkithousenepalofficial@gmail.com"
                className="font-medium underline"
              >
                rapidkithousenepalofficial@gmail.com
              </a>
              .
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-4 border-t border-border bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          We treat your details confidentially. No marketing spam.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.25"
                />
                <path
                  d="M22 12a10 10 0 0 0-10-10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Sending…
            </>
          ) : (
            <>
              Send message
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  icon: React.ReactNode;
};

function FieldWithIcon({
  id,
  name,
  label,
  type,
  placeholder,
  autoComplete,
  required,
  hint,
  icon,
}: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 pl-9 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
    </div>
  );
}
