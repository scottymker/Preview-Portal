import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bazen Woodworking | Custom Cabinets & Fine Woodwork | Corsica, SD",
  description: "Expert custom cabinet maker in Corsica, South Dakota. Steve Bazen brings 20+ years of experience crafting beautiful kitchens, closets, and custom woodwork. Quality craftsmanship you can trust.",
  keywords: "custom cabinets, kitchen cabinets, woodworking, Corsica SD, South Dakota, custom woodwork, cabinet maker",
  openGraph: {
    title: "Bazen Woodworking | Custom Cabinets & Fine Woodwork",
    description: "Expert custom cabinet maker in Corsica, South Dakota. 20+ years of experience crafting beautiful kitchens and custom woodwork.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
