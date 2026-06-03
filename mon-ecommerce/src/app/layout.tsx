import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import ToasterWrapper from "@/components/ToasterWrapper";
import VisitorTracker from "@/components/VisitorTracker";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="fr">
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Suspense fallback={null}>
          <MetaPixel />
          <VisitorTracker />
        </Suspense>
        {children}
        <ToasterWrapper />
      </body>
    </html>
  );
}
