import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/Breadcrumb";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import {
  cities,
  getCityById,
  getArtworksByInstitution,
  getInstitutionsByCity,
  getRegionById,
} from "@/lib/data";
import { formatCount } from "@/lib/format";

export const dynamicParams = false;

type CityPageProps = {
  params: Promise<{ regionId: string; cityId: string }>;
};

export function generateStaticParams() {
  return cities
    .filter((city) => getInstitutionsByCity(city.id).length > 0)
    .map((city) => ({
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

  const institutions = getInstitutionsByCity(city.id).map((institution) => ({
    institution,
    artworkCount: getArtworksByInstitution(institution.id).length,
  }));

  return (
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Regioni", href: "/regioni" },
          { label: region.name, href: `/regioni/${region.id}` },
          { label: city.name, href: `/regioni/${region.id}/${city.id}` },
        ]}
      />
      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          {city.name} ({city.province})
        </h1>
        <p className="text-base text-text-secondary sm:text-lg">
          {formatCount(institutions.length, "istituzione", "istituzioni")} censite
        </p>
      </header>
      {institutions.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-border bg-bg-secondary px-6 text-center text-text-secondary">
          Nessun museo censito in questa città.
        </div>
      ) : (
        <div className="grid gap-4">
          {institutions.map(({ institution, artworkCount }) => (
            <Link
              key={institution.id}
              href={`/regioni/${region.id}/${city.id}/${institution.id}`}
              className="flex min-h-56 flex-col justify-between gap-5 rounded-3xl border border-border bg-bg-secondary p-6 transition-colors hover:border-accent"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
                    {institution.name}
                  </h2>
                  <InstitutionTypeBadge type={institution.type} />
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
                  {institution.description}
                </p>
              </div>
              <p className="text-sm text-text-secondary">
                {formatCount(artworkCount, "opera", "opere")} in catalogo
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
