"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  getAuthorById,
  getMovementById,
  getPeriodById,
  sortArtworksByYear,
} from "@/lib/data";
import { formatCount } from "@/lib/format";
import type { Artwork } from "@/types/schema";

type SortOption = "year-asc" | "year-desc" | "title-asc" | "author-asc";

export interface ArtworkFiltersProps {
  artworks: Artwork[];
  onFiltered: (filtered: Artwork[]) => void;
  showPeriodFilter?: boolean;
  showMovementFilter?: boolean;
  showAuthorFilter?: boolean;
}

function getArtworkYearValue(artwork: Artwork): number | null {
  if (artwork.year !== null) {
    return artwork.year;
  }

  return artwork.year_range ? artwork.year_range[0] : null;
}

function sortArtworks(artworks: Artwork[], sortOption: SortOption): Artwork[] {
  if (sortOption === "year-asc") {
    return sortArtworksByYear(artworks);
  }

  if (sortOption === "year-desc") {
    return [...artworks].sort((left, right) => {
      const leftYear = getArtworkYearValue(left);
      const rightYear = getArtworkYearValue(right);

      if (leftYear === null && rightYear === null) {
        return left.title.localeCompare(right.title, "it");
      }

      if (leftYear === null) {
        return 1;
      }

      if (rightYear === null) {
        return -1;
      }

      if (leftYear === rightYear) {
        return left.title.localeCompare(right.title, "it");
      }

      return rightYear - leftYear;
    });
  }

  if (sortOption === "author-asc") {
    return [...artworks].sort((left, right) => {
      const leftAuthor = getAuthorById(left.author_id)?.name ?? "";
      const rightAuthor = getAuthorById(right.author_id)?.name ?? "";

      if (leftAuthor === rightAuthor) {
        return left.title.localeCompare(right.title, "it");
      }

      return leftAuthor.localeCompare(rightAuthor, "it");
    });
  }

  return [...artworks].sort((left, right) =>
    left.title.localeCompare(right.title, "it"),
  );
}

function fieldClassName() {
  return "rounded-lg border border-border bg-bg-secondary px-4 py-2 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30";
}

export function ArtworkFilters({
  artworks,
  onFiltered,
  showPeriodFilter = true,
  showMovementFilter = true,
  showAuthorFilter = true,
}: ArtworkFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedMovement, setSelectedMovement] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("year-asc");

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredAuthorQuery = useDeferredValue(authorQuery);

  const periodOptions = useMemo(() => {
    return Array.from(new Set(artworks.map((artwork) => artwork.period_id)))
      .map((periodId) => getPeriodById(periodId))
      .filter((period): period is NonNullable<typeof period> => Boolean(period))
      .sort((left, right) => left.start_year - right.start_year);
  }, [artworks]);

  const movementOptions = useMemo(() => {
    return Array.from(new Set(artworks.map((artwork) => artwork.movement_id)))
      .map((movementId) => getMovementById(movementId))
      .filter(
        (movement): movement is NonNullable<typeof movement> => Boolean(movement),
      )
      .sort((left, right) => left.name.localeCompare(right.name, "it"));
  }, [artworks]);

  const authorOptions = useMemo(() => {
    return Array.from(new Set(artworks.map((artwork) => artwork.author_id)))
      .map((authorId) => getAuthorById(authorId))
      .filter((author): author is NonNullable<typeof author> => Boolean(author))
      .sort((left, right) => left.name.localeCompare(right.name, "it"));
  }, [artworks]);

  const useAuthorTextFilter = authorOptions.length > 20;

  const filteredArtworks = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const normalizedAuthorQuery = deferredAuthorQuery.trim().toLowerCase();

    const filtered = artworks.filter((artwork) => {
      const authorName = getAuthorById(artwork.author_id)?.name ?? "";

      const matchesSearch =
        !normalizedSearch ||
        artwork.title.toLowerCase().includes(normalizedSearch) ||
        authorName.toLowerCase().includes(normalizedSearch);
      const matchesPeriod =
        !showPeriodFilter ||
        !selectedPeriod ||
        artwork.period_id === selectedPeriod;
      const matchesMovement =
        !showMovementFilter ||
        !selectedMovement ||
        artwork.movement_id === selectedMovement;
      const matchesAuthor =
        !showAuthorFilter ||
        (useAuthorTextFilter
          ? !normalizedAuthorQuery ||
            authorName.toLowerCase().includes(normalizedAuthorQuery)
          : !selectedAuthorId || artwork.author_id === selectedAuthorId);

      return (
        matchesSearch &&
        matchesPeriod &&
        matchesMovement &&
        matchesAuthor
      );
    });

    return sortArtworks(filtered, sortOption);
  }, [
    artworks,
    deferredAuthorQuery,
    deferredSearchTerm,
    selectedAuthorId,
    selectedMovement,
    selectedPeriod,
    showAuthorFilter,
    showMovementFilter,
    showPeriodFilter,
    sortOption,
    useAuthorTextFilter,
  ]);

  useEffect(() => {
    onFiltered(filteredArtworks);
  }, [filteredArtworks, onFiltered]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm text-text-secondary">
          Cerca
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cerca per titolo o autore..."
            className={fieldClassName()}
          />
        </label>

        {showPeriodFilter ? (
          <label className="flex min-w-[12rem] flex-col gap-1 text-sm text-text-secondary">
            Periodo
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className={fieldClassName()}
            >
              <option value="">Tutti i periodi</option>
              {periodOptions.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showMovementFilter ? (
          <label className="flex min-w-[12rem] flex-col gap-1 text-sm text-text-secondary">
            Corrente
            <select
              value={selectedMovement}
              onChange={(event) => setSelectedMovement(event.target.value)}
              className={fieldClassName()}
            >
              <option value="">Tutte le correnti</option>
              {movementOptions.map((movement) => (
                <option key={movement.id} value={movement.id}>
                  {movement.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showAuthorFilter ? (
          useAuthorTextFilter ? (
            <label className="flex min-w-[14rem] flex-col gap-1 text-sm text-text-secondary">
              Autore
              <input
                type="text"
                value={authorQuery}
                onChange={(event) => setAuthorQuery(event.target.value)}
                placeholder="Filtra per autore..."
                className={fieldClassName()}
              />
            </label>
          ) : (
            <label className="flex min-w-[12rem] flex-col gap-1 text-sm text-text-secondary">
              Autore
              <select
                value={selectedAuthorId}
                onChange={(event) => setSelectedAuthorId(event.target.value)}
                className={fieldClassName()}
              >
                <option value="">Tutti gli autori</option>
                {authorOptions.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </label>
          )
        ) : null}

        <label className="flex min-w-[11rem] flex-col gap-1 text-sm text-text-secondary">
          Ordina per
          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
            className={fieldClassName()}
          >
            <option value="year-asc">Anno ↑</option>
            <option value="year-desc">Anno ↓</option>
            <option value="title-asc">Titolo A–Z</option>
            <option value="author-asc">Autore A–Z</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-text-secondary">
        {filteredArtworks.length === 0
          ? "Nessuna opera trovata"
          : formatCount(filteredArtworks.length, "opera", "opere")}
      </p>
    </div>
  );
}
