"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArtworkImage } from "@/components/ArtworkImage";
import { ArtworkFilters } from "@/components/ArtworkFilters";
import { getAuthorById } from "@/lib/data";
import { formatYear } from "@/lib/format";
import type { Artwork } from "@/types/schema";

interface ArtworkGridProps {
  artworks: Artwork[];
  context: string;
  showPeriodFilter?: boolean;
  showMovementFilter?: boolean;
  showAuthorFilter?: boolean;
  emptyLabel?: string;
}

export function ArtworkGrid({
  artworks,
  context,
  showPeriodFilter = true,
  showMovementFilter = true,
  showAuthorFilter = true,
  emptyLabel = "Nessuna opera trovata.",
}: ArtworkGridProps) {
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>(artworks);

  useEffect(() => {
    setFilteredArtworks(artworks);
  }, [artworks]);

  if (artworks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-bg-secondary px-6 py-10 text-center text-text-secondary">
        {emptyLabel}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <ArtworkFilters
        artworks={artworks}
        onFiltered={setFilteredArtworks}
        showPeriodFilter={showPeriodFilter}
        showMovementFilter={showMovementFilter}
        showAuthorFilter={showAuthorFilter}
      />

      {filteredArtworks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-bg-secondary px-6 py-10 text-center text-text-secondary">
          Nessuna opera trovata con i filtri attivi.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filteredArtworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={{
                pathname: `/opera/${artwork.id}`,
                query: { context },
              }}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-bg-secondary p-4 transition-colors hover:border-accent"
            >
              <ArtworkImage
                image={artwork.image}
                alt={artwork.title}
                className="aspect-[4/3] w-full"
                fit="cover"
              />
              <div className="space-y-1">
                <h2 className="line-clamp-2 font-serif text-xl leading-snug">
                  {artwork.title}
                </h2>
                <p className="text-sm text-text-secondary">
                  {getAuthorById(artwork.author_id)?.name ?? "Autore sconosciuto"}
                </p>
                <p className="text-sm text-text-secondary">
                  {formatYear(artwork)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
