import { notFound } from "next/navigation";

import { ArtworkGrid } from "@/components/ArtworkGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import { ShareBarBottom } from "@/components/ShareBarBottom";
import { ShareButtonCompact } from "@/components/ShareButtonCompact";
import {
  getArtworksByInstitution,
  getCityById,
  getInstitutionById,
  getRegionById,
  institutions,
  sortArtworksByYear,
} from "@/lib/data";
import { formatCount } from "@/lib/format";

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

  const artworks = sortArtworksByYear(getArtworksByInstitution(institution.id));

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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                {institution.name}
              </h1>
              <InstitutionTypeBadge type={institution.type} />
              <ShareButtonCompact
                title={institution.name}
                description={`${institution.name}, ${city.name}`}
              />
            </div>
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
      <ArtworkGrid
        artworks={artworks}
        context={`institution:${institution.id}`}
        emptyLabel="Nessuna opera censita per questo museo."
      />
      <ShareBarBottom
        title={institution.name}
        description={`${institution.name}, ${city.name}`}
        callToAction="Condividi questo museo con chi ama l'arte."
      />
    </section>
  );
}
