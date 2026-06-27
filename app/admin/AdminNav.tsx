"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/types";

const baseLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/generations", label: "Generations" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav({ role, email }: { role: Role; email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const links =
    role === "admin"
      ? [...baseLinks, { href: "/admin/users", label: "Users" }]
      : baseLinks;

  async function logout() {
    setLoggingOut(true);
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.jpeg"
            alt="Rapid Kit House Nepal logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-md object-cover"
          />
          <span className="text-sm font-semibold text-foreground">Admin</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-muted text-primary-dark"
                  : "text-slate-700 hover:bg-muted hover:text-primary-dark"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">
            {email} · <span className="font-medium uppercase">{role}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary-dark disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}
