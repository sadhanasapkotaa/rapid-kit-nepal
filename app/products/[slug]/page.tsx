import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, formatPrice } from "../products";

const FALLBACK_IMAGE = "/images/HIV-Tri-Dot.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Rapid Kit House Nepal" };
  return {
    title: `${product.title} — Rapid Kit House Nepal`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = product.images.length > 0 ? product.images : [FALLBACK_IMAGE];
  const hero = images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/products" className="hover:text-primary-dark">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div
            style={{ position: "relative" }}
            className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-white"
          >
            <Image
              src={hero}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  style={{ position: "relative" }}
                  className="aspect-square overflow-hidden rounded-lg border border-border bg-white"
                >
                  <Image
                    src={src}
                    alt={`${product.title} view ${i + 1}`}
                    fill
                    sizes="20vw"
                    className="object-contain p-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-primary-dark"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Product code: {product.product_code}
          </p>
          <p className="mt-5 text-2xl font-semibold text-foreground">
            {formatPrice(product.price)}
          </p>
          {product.description && (
            <p className="mt-5 text-base leading-7 text-slate-600">
              {product.description}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Enquire about this kit
            </Link>
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary-dark"
            >
              Back to catalogue
            </Link>
          </div>
        </div>
      </div>

      {/* Videos */}
      {product.videos.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Product videos
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {product.videos.map((src, i) => (
              <video
                key={`${src}-${i}`}
                src={src}
                controls
                className="w-full rounded-xl border border-border bg-black"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
