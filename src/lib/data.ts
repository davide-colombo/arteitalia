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

export function getCitiesByRegion(regionId: string): City[] {
  return cities.filter((city) => city.region_id === regionId);
}

export function getInstitutionById(id: string): Institution | undefined {
  return institutionsById.get(id);
}

export function getInstitutionsByCity(cityId: string): Institution[] {
  return institutions.filter((institution) => institution.city_id === cityId);
}

export function getArtworkById(id: string): Artwork | undefined {
  return artworksById.get(id);
}

export function getArtworksByInstitution(institutionId: string): Artwork[] {
  return artworks.filter((artwork) => artwork.institution_id === institutionId);
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

export function getAuthorById(id: string): Author | undefined {
  return authorsById.get(id);
}

export function getMovementById(id: string): Movement | undefined {
  return movementsById.get(id);
}

export function getPeriodById(id: string): Period | undefined {
  return periodsById.get(id);
}
