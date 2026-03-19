// ArtèItalia — Schema dati MVP
// Interfacce TypeScript per tutte le entità del catalogo

export interface Region {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  province: string;
  region_id: string;
}

export type InstitutionType =
  | "pinacoteca"
  | "galleria"
  | "museo"
  | "palazzo"
  | "casa_museo"
  | "museo_civico"
  | "museo_diocesano"
  | "fondazione"
  | "complesso_monumentale"
  | "altro";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  city_id: string;
  description: string;
  website: string | null;
  periods: string[];       // riferimenti a period.id
  movements: string[];     // riferimenti a movement.id
  notes: string | null;
}

export interface Author {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  bio: string;
  movements: string[];     // riferimenti a movement.id
}

export interface Movement {
  id: string;
  name: string;
  period_id: string;       // riferimento a period.id
  description: string;
}

export interface Period {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
}

export interface ArtworkImage {
  source: "wikimedia" | "museo" | "placeholder";
  url: string | null;
  thumbnail: string | null;
  license: string | null;
  attribution: string | null;
}

export interface ArtworkLink {
  label: string;
  url: string;
}

export interface Artwork {
  id: string;
  title: string;
  author_id: string;
  year: number | null;
  year_approximate: boolean;
  year_range: [number, number] | null;
  period_id: string;
  movement_id: string;
  institution_id: string;
  medium: string | null;
  dimensions: string | null;
  description: string;
  image: ArtworkImage;
  links: ArtworkLink[];
  verified: boolean;
  notes: string | null;
}
