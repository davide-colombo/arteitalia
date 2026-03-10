"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatCount, formatLifeYears } from "@/lib/format";

type AuthorDirectoryEntry = {
  id: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  artworkCount: number;
  movements: { id: string; name: string }[];
};

type AuthorDirectoryProps = {
  authors: AuthorDirectoryEntry[];
};

export function AuthorDirectory({ authors }: AuthorDirectoryProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredAuthors = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return authors.filter((author) =>
      !normalizedQuery
        ? true
        : author.name.toLowerCase().includes(normalizedQuery),
    );
  }, [authors, deferredQuery]);

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        <label className="flex max-w-md flex-col gap-1 text-sm text-text-secondary">
          Cerca un autore
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per nome..."
            className="rounded-lg border border-border bg-bg-secondary px-4 py-2 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <p className="text-sm text-text-secondary">
          {filteredAuthors.length === 0
            ? "Nessun autore trovato"
            : formatCount(filteredAuthors.length, "autore", "autori")}
        </p>
      </div>

      {filteredAuthors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-bg-secondary px-6 py-10 text-center text-text-secondary">
          Nessun autore corrisponde alla ricerca.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAuthors.map((author) => (
            <Link
              key={author.id}
              href={`/autori/${author.id}`}
              className="flex min-h-56 flex-col justify-between gap-5 rounded-3xl border border-border bg-bg-secondary p-6 transition-colors hover:border-accent"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="font-serif text-3xl leading-tight">
                    {author.name}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {formatLifeYears(
                      author.birthYear,
                      author.deathYear,
                      "Date non disponibili",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {author.movements.map((movement) => (
                    <span
                      key={movement.id}
                      className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      {movement.name}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-text-secondary">
                {formatCount(author.artworkCount, "opera", "opere")} in catalogo
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
