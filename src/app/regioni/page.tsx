import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import {
  getArtworksByRegion,
  getInstitutionsByRegion,
  regions,
} from "@/lib/data";
import { formatCount } from "@/lib/format";

export default function RegionsPage() {
  const regionCards = regions.map((region) => {
    const institutions = getInstitutionsByRegion(region.id);
    const artworks = getArtworksByRegion(region.id);

    return {
      region,
      institutionCount: institutions.length,
      artworkCount: artworks.length,
    };
  });

  return (
    <PageShell title="Regioni">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {regionCards.map(({ region, institutionCount, artworkCount }) => {
          const hasInstitutions = institutionCount > 0;
          const cardContent = (
            <>
              <div className="space-y-2">
                <h2
                  className={`font-serif text-3xl ${
                    hasInstitutions ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {region.name}
                </h2>
                {!hasInstitutions ? (
                  <p className="text-sm text-text-secondary">Nessun museo censito</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-text-secondary">Istituzioni</p>
                  <p
                    className={hasInstitutions ? "text-text-primary" : "text-text-secondary"}
                  >
                    {formatCount(institutionCount, "museo", "musei")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-text-secondary">Opere</p>
                  <p
                    className={hasInstitutions ? "text-text-primary" : "text-text-secondary"}
                  >
                    {formatCount(artworkCount, "opera", "opere")}
                  </p>
                </div>
              </div>
            </>
          );

          const sharedClassName =
            "flex min-h-52 flex-col justify-between rounded-3xl border bg-bg-secondary p-6";

          return hasInstitutions ? (
            <Link
              key={region.id}
              href={`/regioni/${region.id}`}
              className={`${sharedClassName} border-border transition-colors hover:border-accent`}
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={region.id}
              className={`${sharedClassName} border-border/70 text-text-secondary`}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
