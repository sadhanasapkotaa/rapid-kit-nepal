"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function SiteFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
