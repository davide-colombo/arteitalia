import type { Artwork, InstitutionType } from "@/types/schema";

const institutionTypeLabels: Record<InstitutionType, string> = {
  pinacoteca: "Pinacoteca",
  galleria: "Galleria",
  museo: "Museo",
  palazzo: "Palazzo",
  casa_museo: "Casa museo",
  museo_civico: "Museo civico",
  museo_diocesano: "Museo diocesano",
  fondazione: "Fondazione",
  complesso_monumentale: "Complesso monumentale",
  altro: "Altro",
};

export function formatInstitutionType(type: InstitutionType): string {
  return institutionTypeLabels[type];
}

export function formatYear(
  artwork: Pick<Artwork, "year" | "year_approximate" | "year_range">,
): string {
  if (artwork.year !== null) {
    return artwork.year_approximate
      ? `${artwork.year} ca.`
      : String(artwork.year);
  }

  if (artwork.year_range) {
    return `${artwork.year_range[0]}–${artwork.year_range[1]}`;
  }

  return "Data sconosciuta";
}

export const formatArtworkDate = formatYear;

export function formatLifeYears(
  birthYear: number | null,
  deathYear: number | null,
  fallback?: string,
): string | undefined {
  if (!birthYear && !deathYear) {
    return fallback;
  }

  return `${birthYear ?? "?"} - ${deathYear ?? "?"}`;
}

export function formatCount(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
