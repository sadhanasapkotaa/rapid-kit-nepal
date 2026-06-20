import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Rapid Kit House Nepal",
  description:
    "Reach the Rapid Kit House Nepal team for bulk orders, custom kit configurations, distribution partnerships, or product support.",
};

const channels = [
  {
    label: "Email",
    value: "care@rapidkithouse.com.np",
    href: "mailto:care@rapidkithouse.com.np",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    label: "Phone",
    value: "+977-9866293083",
    href: "tel:+01-015927975",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    label: "Headquarters",
    value: "Kathmandu, Nepal",
    href: "https://maps.google.com/?q=Kathmandu,+Nepal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Hours",
    value: "Mon–Sat · 9:00–18:00 IST",
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-linear-to-br from-muted via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-dark">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Let&apos;s build the right kit for you.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Whether you need 10 kits or 10,000, our team responds within one
            business day. For urgent medical-device queries, please call our
            direct line.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Reach us directly
            </h2>
            <ul className="space-y-4">
              {channels.map((c) => (
                <li
                  key={c.label}
                  className="flex items-start gap-4 rounded-xl border border-border bg-white p-4 shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary-dark">
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {c.label}
                    </p>
                    {c.href ? (
                      <a
                        href={c.href}
                        className="mt-1 block text-sm font-medium text-foreground break-words hover:text-primary-dark"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {c.value}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-surface p-5 ring-1 ring-border">
              <p className="text-sm font-semibold text-foreground">
                Regulatory & adverse-event reporting
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                For product complaints or adverse-event reports, please email{" "}
                <a
                  href="mailto:vigilance@rapidkithouse.com.np"
                  className="font-medium text-primary-dark hover:underline"
                >
                  vigilance@rapidkithouse.com.np
                </a>{" "}
                with the lot number and a brief description.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Fill in the form and the relevant specialist will reply.
            </p>
            <div className="mt-4">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
