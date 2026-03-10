import { notFound } from "next/navigation";

import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import {
  getArtworksByInstitution,
  getAuthorById,
  getCityById,
  getInstitutionById,
  getRegionById,
  institutions,
} from "@/lib/data";

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
    <PageShell
      title={institution.name}
      subtitle={`${city.name}, ${region.name}`}
    >
      <p className="max-w-3xl text-text-secondary">{institution.description}</p>
      <EntityList
        items={artworks.map((artwork) => ({
          href: `/opera/${artwork.id}`,
          title: artwork.title,
          meta: artwork.year ? String(artwork.year) : "Anno non disponibile",
          description:
            getAuthorById(artwork.author_id)?.name ?? "Autore non disponibile",
        }))}
        emptyLabel="Nessuna opera disponibile per questa istituzione."
      />
    </PageShell>
  );
}
