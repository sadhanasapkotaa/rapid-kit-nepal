import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteFrame } from "./components/SiteFrame";
import { Footer } from "./components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rapid Kit House Nepal — Trusted Medical Kits for Every Need",
  description:
    "Rapid Kit House Nepal manufactures and distributes professional-grade medical kits for clinics, hospitals, and households — from pregnancy and HIV testing to first aid and surgical care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteFrame footer={<Footer />}>{children}</SiteFrame>
      </body>
    </html>
  );
}
