"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import {
  artworks,
  authors,
  getAuthorById,
  getArtworksByAuthor,
  getCityByInstitutionId,
  getInstitutionPath,
  getRegionByInstitutionId,
  institutions,
} from "@/lib/data";
import { formatCount, formatYear } from "@/lib/format";

function buildSearchHref(query: string) {
  const trimmedQuery = query.trim();

  return trimmedQuery ? `/cerca?q=${encodeURIComponent(trimmedQuery)}` : "/cerca";
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-3xl">{title}</h2>
      {children}
    </section>
  );
}

export function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(currentQuery);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery === currentQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        router.replace(buildSearchHref(trimmedQuery));
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuery, query, router]);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const artworkResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return [...artworks]
      .filter((artwork) => {
        const authorName = getAuthorById(artwork.author_id)?.name ?? "";

        return (
          artwork.title.toLowerCase().includes(normalizedQuery) ||
          authorName.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((left, right) => left.title.localeCompare(right.title, "it"))
      .slice(0, 10);
  }, [normalizedQuery]);

  const institutionResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return [...institutions]
      .filter((institution) =>
        institution.name.toLowerCase().includes(normalizedQuery),
      )
      .sort((left, right) => left.name.localeCompare(right.name, "it"))
      .slice(0, 10);
  }, [normalizedQuery]);

  const authorResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return [...authors]
      .filter((author) => author.name.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => left.name.localeCompare(right.name, "it"))
      .slice(0, 10);
  }, [normalizedQuery]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      router.push(buildSearchHref(query));
    });
  }

  const totalResults =
    artworkResults.length + institutionResults.length + authorResults.length;

  return (
    <PageShell
      title="Cerca nel catalogo"
      subtitle="Trova opere, musei e autori in tutto l'archivio."
    >
      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <label className="flex flex-col gap-2 text-sm text-text-secondary">
            Ricerca globale
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca opere, musei o autori..."
              className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </form>

        {!normalizedQuery ? (
          <div className="rounded-3xl border border-dashed border-border bg-bg-secondary px-6 py-10 text-center text-text-secondary">
            Inizia a digitare per cercare nel catalogo.
          </div>
        ) : totalResults === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-bg-secondary px-6 py-10 text-center text-text-secondary">
            Nessun risultato per &quot;{deferredQuery.trim()}&quot;.
          </div>
        ) : (
          <div className="space-y-10">
            <p className="text-sm text-text-secondary">
              {formatCount(totalResults, "risultato", "risultati")} per &quot;
              {deferredQuery.trim()}&quot;
            </p>

            {artworkResults.length > 0 ? (
              <SearchSection title="Opere">
                <div className="grid gap-3">
                  {artworkResults.map((artwork) => (
                    <Link
                      key={artwork.id}
                      href={`/opera/${artwork.id}`}
                      className="rounded-2xl border border-border bg-bg-secondary px-5 py-4 transition-colors hover:border-accent"
                    >
                      <div className="space-y-1">
                        <h3 className="font-serif text-2xl">{artwork.title}</h3>
                        <p className="text-sm text-text-secondary">
                          {getAuthorById(artwork.author_id)?.name ??
                            "Autore sconosciuto"}{" "}
                          · {formatYear(artwork)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </SearchSection>
            ) : null}

            {institutionResults.length > 0 ? (
              <SearchSection title="Musei">
                <div className="grid gap-3">
                  {institutionResults.map((institution) => {
                    const city = getCityByInstitutionId(institution.id);
                    const region = getRegionByInstitutionId(institution.id);
                    const path = getInstitutionPath(institution.id);

                    if (!city || !region || !path) {
                      return null;
                    }

                    return (
                      <Link
                        key={institution.id}
                        href={path}
                        className="rounded-2xl border border-border bg-bg-secondary px-5 py-4 transition-colors hover:border-accent"
                      >
                        <div className="space-y-1">
                          <h3 className="font-serif text-2xl">
                            {institution.name}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {city.name}, {region.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </SearchSection>
            ) : null}

            {authorResults.length > 0 ? (
              <SearchSection title="Autori">
                <div className="grid gap-3">
                  {authorResults.map((author) => (
                    <Link
                      key={author.id}
                      href={`/autori/${author.id}`}
                      className="rounded-2xl border border-border bg-bg-secondary px-5 py-4 transition-colors hover:border-accent"
                    >
                      <div className="space-y-1">
                        <h3 className="font-serif text-2xl">{author.name}</h3>
                        <p className="text-sm text-text-secondary">
                          {formatCount(
                            getArtworksByAuthor(author.id).length,
                            "opera",
                            "opere",
                          )}{" "}
                          in catalogo
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </SearchSection>
            ) : null}
          </div>
        )}
      </div>
    </PageShell>
  );
}
