export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
};

export const products: Product[] = [
  {
    slug: "hiv-tri-dot",
    name: "HIV-Tri-Dot",
    category: "HIV Diagnostics",
    price: 899,
    description:
      "Rapid visual immunoassay for the qualitative detection of antibodies to HIV-1 and HIV-2 in human serum, plasma, or whole blood.",
    image: "/images/HIV-Tri-Dot.webp",
  },
  {
    slug: "tridot-hcv",
    name: "Tridot-HCV",
    category: "HCV Diagnostics",
    price: 949,
    description:
      "Rapid, sensitive immunoassay for the qualitative detection of antibodies to Hepatitis C virus in human serum or plasma.",
    image: "/images/Tridot-HCV.jpg",
  },
  {
    slug: "abbott-hcv",
    name: "Abbott-hcv",
    category: "HCV Diagnostics",
    price: 1199,
    description:
      "Abbott rapid HCV antibody test for reliable point-of-care screening with clear visual results in minutes.",
    image: "/images/Abbott-hcv.webp",
  },
  {
    slug: "all-test-hcv",
    name: "All-test-hcv",
    category: "HCV Diagnostics",
    price: 849,
    description:
      "All-Test HCV one-step antibody cassette for qualitative detection in serum, plasma, or whole blood samples.",
    image: "/images/All-test-hcv.webp",
  },
  {
    slug: "cg-hcv",
    name: "Cg-hcv",
    category: "HCV Diagnostics",
    price: 799,
    description:
      "CG rapid HCV antibody test strip — economical screening tool suitable for clinics, camps, and outreach programs.",
    image: "/images/Cg-hcv.webp",
  },
  {
    slug: "elisa-hcv",
    name: "Elisa-hcv",
    category: "HCV Diagnostics",
    price: 2499,
    description:
      "ELISA-based HCV antibody detection kit for laboratory use, delivering quantitative results with high sensitivity and specificity.",
    image: "/images/Elisa-hcv.webp",
  },
  {
    slug: "newscan-hcv",
    name: "newscan-hcv",
    category: "HCV Diagnostics",
    price: 879,
    description:
      "Newscan rapid HCV antibody cassette designed for fast, reliable screening in resource-limited settings.",
    image: "/images/newscan-hcv.webp",
  },
];

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
