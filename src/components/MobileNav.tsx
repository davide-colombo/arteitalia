"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type MobileNavProps = {
  items: { href: string; label: string }[];
};

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canPortal = typeof document !== "undefined";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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

      {isOpen && canPortal
        ? createPortal(
            <div
              className="fixed inset-0 z-50 bg-bg-primary md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu di navigazione"
            >
              <div className="flex h-full flex-col overflow-y-auto bg-bg-primary">
                <div className="flex items-center justify-end px-4 py-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Chiudi il menu"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-primary text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
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

                <div className="flex flex-1 flex-col justify-center pb-10">
                  <nav className="flex flex-col border-t border-border">
                    <Link
                      href="/cerca"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 border-b border-border px-6 py-4 text-xl text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:text-accent"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="6" />
                        <path d="M20 20l-4.2-4.2" />
                      </svg>
                      <span>Cerca</span>
                    </Link>

                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="border-b border-border px-6 py-4 text-xl text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:text-accent"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
