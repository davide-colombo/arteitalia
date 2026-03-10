"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MobileNavProps = {
  items: { href: string; label: string }[];
};

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Apri il menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-primary text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-bg-primary md:hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="font-serif text-3xl text-text-primary"
            >
              ArtèItalia
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Chiudi il menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-secondary text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col px-6 py-8">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-border py-4 font-serif text-4xl leading-tight text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
