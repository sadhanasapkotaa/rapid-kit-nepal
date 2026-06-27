import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts, formatPrice } from "./products/products";

const FALLBACK_IMAGE = "/images/HIV-Tri-Dot.webp";

const features = [
  {
    title: "Clinically validated",
    body: "Every kit is assembled with components that meet ISO 13485 quality and CE/FDA reference standards.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  {
    title: "Sealed for safety",
    body: "Tamper-evident packaging and lot-level traceability so you always know what you're using and when.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Ships globally",
    body: "Cold-chain and temperature-controlled logistics to clinics, NGOs, and households across 30+ countries.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15 15 0 0 1 0 20" />
        <path d="M12 2a15 15 0 0 0 0 20" />
      </svg>
    ),
  },
];

export default async function Home() {
  const featured = await getFeaturedProducts(3);
  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-br from-muted via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-dark ring-1 ring-border">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              ISO 13485 · CE marked
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Medical kits you can trust, ready when life can&apos;t wait.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Rapid Kit House Nepal designs and manufactures professional-grade medical kits
              for clinics, hospitals, NGOs, and households from pregnancy and
              HIV testing to first aid and minor surgery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Browse our kits
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary-dark"
              >
                Talk to our team
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3 sm:gap-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                  Kits shipped
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  2.4M
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                  Countries
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  30+
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                  Years
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  18
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <div
              style={{ position: "relative" }}
              className="aspect-3/2 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border"
            >
              <Image
                src="/test-kit.png"
                alt="Rapid Kit House Nepal rapid test kits: pregnancy, HIV, malaria, typhoid and dengue"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                preload
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-xl bg-white p-4 shadow-lg ring-1 ring-border md:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Trusted by 800+ clinics
                  </p>
                  <p className="text-xs text-slate-500">across India & SEA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-primary-dark">
                {f.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Featured kits
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">
                A snapshot of our most-requested products. Browse the full
                catalogue for 15 specialised kits.
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-primary-dark hover:underline"
            >
              View all products →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  style={{ position: "relative" }}
                  className="aspect-4/3 w-full overflow-hidden bg-muted"
                >
                  <Image
                    src={p.images[0] ?? FALLBACK_IMAGE}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  {p.tags[0] && (
                    <p className="text-xs font-medium uppercase tracking-wide text-primary-dark">
                      {p.tags[0].name}
                    </p>
                  )}
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-4 text-base font-semibold text-foreground">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-2xl bg-primary px-6 py-10 text-white sm:px-8 sm:py-12 md:px-12">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                Equipping your clinic or NGO? Let&apos;s talk volume.
              </h2>
              <p className="mt-2 max-w-2xl text-white/80">
                We offer institutional pricing, custom kit configurations, and
                priority shipping for clinics, hospitals, and public-health
                programs.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-primary-dark shadow-sm transition-colors hover:bg-muted"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
