import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import ToasterWrapper from "@/components/ToasterWrapper";
import VisitorTracker from "@/components/VisitorTracker";
import AuthInitializer from "@/components/AuthInitializer";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shopeazy Admin",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${instrumentSans.variable} ${inter.variable}`}
      style={{ scrollBehavior: "smooth" }}
      suppressHydrationWarning
    >
      <body
        className="antialiased"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <MetaPixel />
          <VisitorTracker />
          <AuthInitializer />
          <ServiceWorkerRegister />
        </Suspense>
        {children}
        <ToasterWrapper />
      </body>
    </html>
  );
}
