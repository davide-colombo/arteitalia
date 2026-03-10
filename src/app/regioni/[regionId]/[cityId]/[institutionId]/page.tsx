import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkPlaceholder } from "@/components/ArtworkPlaceholder";
import { Breadcrumb } from "@/components/Breadcrumb";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import {
  getArtworksByInstitution,
  getAuthorById,
  getCityById,
  getInstitutionById,
  getRegionById,
  institutions,
} from "@/lib/data";
import { formatArtworkDate, formatCount } from "@/lib/format";

export const dynamicParams = false;

type InstitutionPageProps = {
  params: Promise<{
    regionId: string;
    cityId: string;
    institutionId: string;
  }>;
};

export function generateStaticParams() {
  return institutions.flatMap((institution) => {
    const city = getCityById(institution.city_id);

    if (!city) {
      return [];
    }

    return [
      {
        regionId: city.region_id,
        cityId: city.id,
        institutionId: institution.id,
      },
    ];
  });
}

export default async function InstitutionPage({
  params,
}: InstitutionPageProps) {
  const { regionId, cityId, institutionId } = await params;
  const institution = getInstitutionById(institutionId);
  const city = getCityById(cityId);
  const region = getRegionById(regionId);

  if (
    !institution ||
    !city ||
    !region ||
    institution.city_id !== city.id ||
    city.region_id !== region.id
  ) {
    notFound();
  }

  const artworks = getArtworksByInstitution(institution.id);

  return (
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Regioni", href: "/regioni" },
          { label: region.name, href: `/regioni/${region.id}` },
          { label: city.name, href: `/regioni/${region.id}/${city.id}` },
          {
            label: institution.name,
            href: `/regioni/${region.id}/${city.id}/${institution.id}`,
          },
        ]}
      />
      <section className="space-y-5 rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              {institution.name}
            </h1>
            <InstitutionTypeBadge type={institution.type} />
          </div>
          {institution.website ? (
            <a
              href={institution.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent transition-colors hover:text-accent-hover"
            >
              Visita il sito del museo
            </a>
          ) : null}
        </div>
        <p className="max-w-4xl leading-7 text-text-secondary">
          {institution.description}
        </p>
        <p className="text-sm text-text-secondary">
          {formatCount(artworks.length, "opera", "opere")} censite in catalogo
        </p>
      </section>
      {artworks.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-border bg-bg-secondary px-6 text-center text-text-secondary">
          Nessuna opera censita per questo museo.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {artworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/opera/${artwork.id}`}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-bg-secondary p-4 transition-colors hover:border-accent"
            >
              <ArtworkPlaceholder className="aspect-[4/3] w-full" />
              <div className="space-y-1">
                <h2 className="font-serif text-xl leading-snug line-clamp-2">
                  {artwork.title}
                </h2>
                <p className="text-sm text-text-secondary">
                  {getAuthorById(artwork.author_id)?.name ?? "Autore sconosciuto"}
                </p>
                <p className="text-sm text-text-secondary">
                  {formatArtworkDate(artwork)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
