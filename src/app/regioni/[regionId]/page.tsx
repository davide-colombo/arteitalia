import { notFound } from "next/navigation";

import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import { getCitiesByRegion, getRegionById, regions } from "@/lib/data";

export const dynamicParams = false;

type RegionPageProps = {
  params: Promise<{ regionId: string }>;
};

export function generateStaticParams() {
  return regions.map((region) => ({ regionId: region.id }));
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { regionId } = await params;
  const region = getRegionById(regionId);

  if (!region) {
    notFound();
  }

  const cities = getCitiesByRegion(region.id);

  return (
    <PageShell title={region.name} subtitle="Città presenti nel catalogo.">
      <EntityList
        items={cities.map((city) => ({
          href: `/regioni/${region.id}/${city.id}`,
          title: city.name,
          meta: city.province,
        }))}
        emptyLabel="Nessuna città disponibile per questa regione."
      />
    </PageShell>
  );
}
