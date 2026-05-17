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
  title: "Boutique E-commerce",
  description: "Boutique en ligne Cash On Delivery",
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
