import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface sm:mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight">
              Rapid Kit House Nepal
            </span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Professional-grade medical kits manufactured to international
            standards. Trusted by clinics, hospitals, NGOs, and households in
            over 30 countries.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/about" className="hover:text-primary-dark">
                About
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-primary-dark">
                Products
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary-dark">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Kathmandu, Nepal</li>
            <li>+977-9866293083</li>
            <li>rapidkithousenepal@gmail.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6">
          <p>© {new Date().getFullYear()} Rapid Kit House Nepal Medical Pvt. Ltd.</p>
          <p>ISO 13485 certified · CE marked products</p>
        </div>
      </div>
    </footer>
  );
}
