import artworksData from "@/data/artworks.json";
import authorsData from "@/data/authors.json";
import citiesData from "@/data/cities.json";
import institutionsData from "@/data/institutions.json";
import movementsData from "@/data/movements.json";
import periodsData from "@/data/periods.json";
import regionsData from "@/data/regions.json";
import type {
  Artwork,
  Author,
  City,
  Institution,
  Movement,
  Period,
  Region,
} from "@/types/schema";

export type ArtworkContextType =
  | "institution"
  | "author"
  | "period"
  | "movement";

export type ArtworkContext = {
  type: ArtworkContextType;
  id: string;
};

export const regions = regionsData as Region[];
export const cities = citiesData as City[];
export const institutions = institutionsData as Institution[];
export const authors = authorsData as Author[];
export const movements = movementsData as Movement[];
export const periods = periodsData as Period[];
export const artworks = artworksData as Artwork[];

function createIndex<T extends { id: string }>(entries: T[]) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

const regionsById = createIndex(regions);
const citiesById = createIndex(cities);
const institutionsById = createIndex(institutions);
const authorsById = createIndex(authors);
const movementsById = createIndex(movements);
const periodsById = createIndex(periods);
const artworksById = createIndex(artworks);

export function getRegionById(id: string): Region | undefined {
  return regionsById.get(id);
}

export function getCityById(id: string): City | undefined {
  return citiesById.get(id);
}

export function getRegionByCityId(cityId: string): Region | undefined {
  const city = getCityById(cityId);

  return city ? getRegionById(city.region_id) : undefined;
}

export function getCitiesByRegion(regionId: string): City[] {
  return cities.filter((city) => city.region_id === regionId);
}

export function getCitiesWithInstitutionsByRegion(regionId: string): City[] {
  return getCitiesByRegion(regionId).filter(
    (city) => getInstitutionsByCity(city.id).length > 0,
  );
}

export function getInstitutionById(id: string): Institution | undefined {
  return institutionsById.get(id);
}

export function getCityByInstitutionId(
  institutionId: string,
): City | undefined {
  const institution = getInstitutionById(institutionId);

  return institution ? getCityById(institution.city_id) : undefined;
}

export function getRegionByInstitutionId(
  institutionId: string,
): Region | undefined {
  const city = getCityByInstitutionId(institutionId);

  return city ? getRegionById(city.region_id) : undefined;
}

export function getInstitutionPath(institutionId: string): string | null {
  const institution = getInstitutionById(institutionId);
  const city = getCityByInstitutionId(institutionId);
  const region = getRegionByInstitutionId(institutionId);

  if (!institution || !city || !region) {
    return null;
  }

  return `/regioni/${region.id}/${city.id}/${institution.id}`;
}

export function getInstitutionsByCity(cityId: string): Institution[] {
  return institutions.filter((institution) => institution.city_id === cityId);
}

export function getInstitutionsByRegion(regionId: string): Institution[] {
  const cityIds = new Set(getCitiesByRegion(regionId).map((city) => city.id));

  return institutions.filter((institution) => cityIds.has(institution.city_id));
}

export function getArtworkById(id: string): Artwork | undefined {
  return artworksById.get(id);
}

export function getArtworksByInstitution(institutionId: string): Artwork[] {
  return artworks.filter((artwork) => artwork.institution_id === institutionId);
}

export function getArtworksByCity(cityId: string): Artwork[] {
  const institutionIds = new Set(
    getInstitutionsByCity(cityId).map((institution) => institution.id),
  );

  return artworks.filter((artwork) => institutionIds.has(artwork.institution_id));
}

export function getArtworksByRegion(regionId: string): Artwork[] {
  const institutionIds = new Set(
    getInstitutionsByRegion(regionId).map((institution) => institution.id),
  );

  return artworks.filter((artwork) => institutionIds.has(artwork.institution_id));
}

export function getArtworksByAuthor(authorId: string): Artwork[] {
  return artworks.filter((artwork) => artwork.author_id === authorId);
}

export function getArtworksByPeriod(periodId: string): Artwork[] {
  return artworks.filter((artwork) => artwork.period_id === periodId);
}

export function getArtworksByMovement(movementId: string): Artwork[] {
  return artworks.filter((artwork) => artwork.movement_id === movementId);
}

function getArtworkYearValue(artwork: Artwork): number | null {
  if (artwork.year !== null) {
    return artwork.year;
  }

  return artwork.year_range ? artwork.year_range[0] : null;
}

export function sortArtworksByYear(entries: Artwork[]): Artwork[] {
  return [...entries].sort((left, right) => {
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

    return leftYear - rightYear;
  });
}

export function sortArtworksByTitle(entries: Artwork[]): Artwork[] {
  return [...entries].sort((left, right) =>
    left.title.localeCompare(right.title, "it"),
  );
}

export function parseArtworkContext(
  value: string | string[] | undefined,
): ArtworkContext | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return null;
  }

  const [type, ...rest] = rawValue.split(":");
  const id = rest.join(":").trim();

  if (
    (type === "institution" ||
      type === "author" ||
      type === "period" ||
      type === "movement") &&
    id
  ) {
    return {
      type,
      id,
    };
  }

  return null;
}

export function getArtworksForContext(context: ArtworkContext | null): Artwork[] {
  if (!context) {
    return sortArtworksByTitle(artworks);
  }

  if (context.type === "institution") {
    return sortArtworksByYear(getArtworksByInstitution(context.id));
  }

  if (context.type === "author") {
    return sortArtworksByYear(getArtworksByAuthor(context.id));
  }

  if (context.type === "period") {
    return sortArtworksByYear(getArtworksByPeriod(context.id));
  }

  return sortArtworksByYear(getArtworksByMovement(context.id));
}

export function getAuthorById(id: string): Author | undefined {
  return authorsById.get(id);
}

export function getMovementById(id: string): Movement | undefined {
  return movementsById.get(id);
}

export function getPeriodById(id: string): Period | undefined {
  return periodsById.get(id);
}
