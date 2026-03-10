"use client";

import { startTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function buildSearchHref(query: string) {
  const trimmedQuery = query.trim();

  return trimmedQuery ? `/cerca?q=${encodeURIComponent(trimmedQuery)}` : "/cerca";
}

function NavbarSearchForm({
  initialQuery,
  isSearchPage,
}: {
  initialQuery: string;
  isSearchPage: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(
    isSearchPage || initialQuery.length > 0,
  );

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      if (isSearchPage && initialQuery) {
        const timeoutId = window.setTimeout(() => {
          startTransition(() => {
            router.replace("/cerca");
          });
        }, 300);

        return () => window.clearTimeout(timeoutId);
      }

      return;
    }

    if (isSearchPage && trimmedQuery === initialQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        router.replace(buildSearchHref(trimmedQuery));
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [initialQuery, isSearchPage, query, router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOpen(true);

    startTransition(() => {
      router.push(buildSearchHref(query));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cerca nel catalogo..."
        className={`rounded-lg border border-border bg-bg-primary/80 py-2 pl-4 pr-11 text-sm text-text-primary outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 ${
          isOpen
            ? "w-52 opacity-100 sm:w-60 md:w-64"
            : "pointer-events-none w-0 border-transparent px-0 opacity-0 md:pointer-events-auto md:w-64 md:border-border md:px-4 md:pr-11 md:opacity-100"
        }`}
      />
      <button
        type={isOpen ? "submit" : "button"}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
          }
        }}
        aria-label="Apri la ricerca"
        className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4.2-4.2" />
        </svg>
      </button>
    </form>
  );
}

export function NavbarSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  return (
    <NavbarSearchForm
      key={`${pathname}:${currentQuery}`}
      initialQuery={currentQuery}
      isSearchPage={pathname === "/cerca"}
    />
  );
}
