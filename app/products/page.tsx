import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, formatPrice } from "./products";

export const metadata: Metadata = {
  title: "Products — Rapid Kit House Nepal Medical Kits",
  description:
    "Browse our range of rapid HIV and HCV diagnostic kits — sealed, lot-traceable, and ready to deploy.",
};

const FALLBACK_IMAGE = "/images/HIV-Tri-Dot.webp";

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = Array.from(
    new Set(products.flatMap((p) => p.tags.map((t) => t.name))),
  );

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
          {categories.length > 0 && (
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
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {products.length === 0 ? (
          <p className="text-slate-600">
            Our catalogue is being updated. Please check back soon or{" "}
            <Link
              href="/contact"
              className="font-semibold text-primary-dark hover:underline"
            >
              get in touch
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/products/${p.slug}`}
                  style={{ position: "relative" }}
                  className="block aspect-square w-full overflow-hidden bg-white"
                >
                  <Image
                    src={p.images[0] ?? FALLBACK_IMAGE}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span
                          key={t.id}
                          className="text-xs font-medium uppercase tracking-wide text-primary-dark"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    <Link
                      href={`/products/${p.slug}`}
                      className="hover:text-primary-dark"
                    >
                      {p.title}
                    </Link>
                  </h2>
                  {p.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <p className="text-base font-semibold text-foreground">
                      {formatPrice(p.price)}
                    </p>
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-sm font-semibold text-primary-dark hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
