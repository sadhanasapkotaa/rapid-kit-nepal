import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Rapid Kit House Nepal",
  description:
    "Rapid Kit House Nepal manufactures professional-grade medical kits trusted by clinics, hospitals, and households in 30+ countries.",
};

const values = [
  {
    title: "Quality without compromise",
    body: "We source from ISO-certified manufacturers and batch-test every component. If it doesn't pass, it doesn't ship.",
  },
  {
    title: "Access for everyone",
    body: "Whether you're a tier-1 hospital or a rural NGO, our pricing tiers and bulk programs keep essential care affordable.",
  },
  {
    title: "Clinician-led design",
    body: "Every kit is co-designed with practising doctors, nurses, and field workers — so what's inside is what's actually needed.",
  },
];

const milestones = [
  { year: "2007", text: "Rapid Kit House Nepal founded in Kathmandu with a single first-aid product line." },
  { year: "2012", text: "Achieved ISO 13485 certification for medical device quality management." },
  { year: "2017", text: "Expanded to 15 countries through partnerships with public-health NGOs." },
  { year: "2021", text: "Launched our COVID-19 rapid-test kit, distributing 6M units in 18 months." },
  { year: "2025", text: "Crossed 2.4M kits shipped and opened a second facility in Pune." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-linear-to-br from-muted via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-dark">
              About Rapid Kit House Nepal
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Eighteen years of putting the right kit in the right hands.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              We&apos;re a team of clinicians, designers, and supply-chain
              specialists making sure that whether you&apos;re in an ICU or a
              village clinic, you have a medical kit that works the first time,
              every time.
            </p>
          </div>
          <div
            style={{ position: "relative" }}
            className="aspect-4/3 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border"
          >
            <Image
              src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=85"
              alt="Healthcare team in a hospital corridor"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Our mission
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Modern healthcare depends on the simple things being done right:
              the right swab, the right dressing, the right test, in date and
              ready to use. Rapid Kit House Nepal exists to make that simple thing reliable —
              for every patient, in every setting.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              We build, test, and ship 15 specialised medical kits used in
              maternal care, chronic disease management, emergency response,
              and outpatient surgery.
            </p>
          </div>
          <div className="space-y-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-border bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Milestones
          </h2>
          <ol className="mt-10 space-y-6 border-l-2 border-border pl-6">
            {milestones.map((m) => (
              <li key={m.year} className="relative">
                <span className="absolute -left-[33px] mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-surface" />
                <p className="text-sm font-semibold text-primary-dark">
                  {m.year}
                </p>
                <p className="mt-1 text-base text-slate-700">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 md:p-12">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                Want to partner with us?
              </h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                We work with hospitals, NGOs, government programs, and
                pharmacies. Tell us what you need — we&apos;ll design a kit
                program around it.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
