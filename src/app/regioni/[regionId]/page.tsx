import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/Breadcrumb";
import {
  getArtworksByCity,
  getCitiesWithInstitutionsByRegion,
  getInstitutionsByCity,
  getRegionById,
  regions,
} from "@/lib/data";
import { formatCount } from "@/lib/format";

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

  const cities = getCitiesWithInstitutionsByRegion(region.id).map((city) => ({
    city,
    institutionCount: getInstitutionsByCity(city.id).length,
    artworkCount: getArtworksByCity(city.id).length,
  }));

  return (
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Regioni", href: "/regioni" },
          { label: region.name, href: `/regioni/${region.id}` },
        ]}
      />
      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          {region.name}
        </h1>
        <p className="text-base text-text-secondary sm:text-lg">
          {formatCount(
            cities.length,
            "città con museo censita",
            "città con museo censite",
          )}
        </p>
      </header>
      {cities.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-border bg-bg-secondary px-6 text-center text-text-secondary">
          Nessun museo censito in questa regione.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cities.map(({ city, institutionCount, artworkCount }) => (
            <Link
              key={city.id}
              href={`/regioni/${region.id}/${city.id}`}
              className="flex min-h-48 flex-col justify-between rounded-3xl border border-border bg-bg-secondary p-6 transition-colors hover:border-accent"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-3xl">{city.name}</h2>
                  <span className="text-sm text-text-secondary">
                    {city.province}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-text-secondary">Istituzioni</p>
                  <p>{formatCount(institutionCount, "museo", "musei")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-text-secondary">Opere</p>
                  <p>{formatCount(artworkCount, "opera", "opere")}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
