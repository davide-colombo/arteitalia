import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ArtèItalia",
  description: "Catalogo digitale dell'arte pittorica italiana",
};

const navigationItems = [
  { href: "/regioni", label: "Regioni" },
  { href: "/autori", label: "Autori" },
  { href: "/periodi", label: "Periodi" },
  { href: "/correnti", label: "Correnti" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${inter.variable} ${cormorantGaramond.variable} bg-bg-primary font-sans text-text-primary antialiased`}
      >
        <div className="flex min-h-screen flex-col bg-bg-primary">
          <header className="sticky top-0 z-40 border-b border-border bg-bg-secondary/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-16">
              <Link
                href="/"
                className="font-serif text-3xl leading-none transition-colors hover:text-accent"
              >
                ArtèItalia
              </Link>
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary sm:text-base">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-16">
              {children}
            </div>
          </main>
          <footer className="border-t border-border bg-bg-secondary">
            <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-text-secondary md:px-8 lg:px-16">
              ArtèItalia — Un progetto personale di Davide Colombo
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
