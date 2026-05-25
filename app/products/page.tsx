import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { products, formatPrice } from "./products";

export const metadata: Metadata = {
  title: "Products — Rapid Kit House Nepal Medical Kits",
  description:
    "Browse our range of rapid HIV and HCV diagnostic kits — sealed, lot-traceable, and ready to deploy.",
};

const categories = Array.from(new Set(products.map((p) => p.category)));

export default function ProductsPage() {
  return (
    <>
      <section className="bg-linear-to-br from-muted via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-dark">
            Catalogue
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Rapid Medical kits, built for real-world care.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Every kit ships sealed, lot-traceable, and ready to deploy. Need a
            custom configuration or institutional pricing?{" "}
            <Link
              href="/contact"
              className="font-semibold text-primary-dark hover:underline"
            >
              Talk to us
            </Link>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-border"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.slug}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                style={{ position: "relative" }}
                className="aspect-square w-full overflow-hidden bg-white"
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-primary-dark">
                  {p.category}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {p.name}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {p.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <p className="text-base font-semibold text-foreground">
                    {formatPrice(p.price)}
                  </p>
                  <Link
                    href="/contact"
                    className="text-sm font-semibold text-primary-dark hover:underline"
                  >
                    Enquire →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
