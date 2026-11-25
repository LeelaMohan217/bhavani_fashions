import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // opsz sharpens large headings (font-optical-sizing in globals.css); the unused SOFT axis is left out
  // to keep the font files smaller
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kosha | Handpicked Sarees, Lehengas & Kurta Sets",
    template: "%s | Kosha",
  },
  description:
    "Handwoven sarees, festive lehengas and everyday kurta sets, handpicked from India's finest weaving clusters. Free shipping across India.",
};

// Root shell only — the storefront chrome lives in (store)/layout.tsx and the admin has its own.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
