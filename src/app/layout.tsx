import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Artisan — Find trusted artisans near you",
  description: "Verified plumbers, electricians, tailors and mechanics. Filter by trade and area, then request a quote.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
