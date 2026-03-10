import { notFound } from "next/navigation";

import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import {
  cities,
  getCityById,
  getInstitutionsByCity,
  getRegionById,
} from "@/lib/data";

export const dynamicParams = false;

type CityPageProps = {
  params: Promise<{ regionId: string; cityId: string }>;
};

export function generateStaticParams() {
  return cities.map((city) => ({
    regionId: city.region_id,
    cityId: city.id,
  }));
}

export default async function CityPage({ params }: CityPageProps) {
  const { regionId, cityId } = await params;
  const city = getCityById(cityId);
  const region = getRegionById(regionId);

  if (!city || !region || city.region_id !== region.id) {
    notFound();
  }

  const institutions = getInstitutionsByCity(city.id);

  return (
    <PageShell
      title={city.name}
      subtitle={`Istituzioni presenti in ${city.name}, ${region.name}.`}
    >
      <EntityList
        items={institutions.map((institution) => ({
          href: `/regioni/${region.id}/${city.id}/${institution.id}`,
          title: institution.name,
          meta: institution.type.replaceAll("_", " "),
        }))}
        emptyLabel="Nessuna istituzione disponibile per questa città."
      />
    </PageShell>
  );
}
