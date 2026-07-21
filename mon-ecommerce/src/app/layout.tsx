import { Suspense } from "react";
import type { Metadata } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import ToasterWrapper from "@/components/ToasterWrapper";
import VisitorTracker from "@/components/VisitorTracker";
import AuthInitializer from "@/components/AuthInitializer";

const instrumentSans = Instrument_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopEazy",
  description: "Créez votre boutique e-commerce en quelques minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${instrumentSans.variable} ${inter.variable}`} style={{ scrollBehavior: "smooth" }}>
      <body className="antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Suspense fallback={null}>
          <MetaPixel />
          <VisitorTracker />
          <AuthInitializer />
        </Suspense>
        {children}
        <ToasterWrapper />
      </body>
    </html>
  );
}
