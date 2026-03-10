import { notFound } from "next/navigation";

import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import {
  getArtworksByPeriod,
  getAuthorById,
  getPeriodById,
  periods,
  sortArtworksByYear,
} from "@/lib/data";
import { formatYear } from "@/lib/format";

export const dynamicParams = false;

type PeriodPageProps = {
  params: Promise<{ periodId: string }>;
};

export function generateStaticParams() {
  return periods.map((period) => ({ periodId: period.id }));
}

export default async function PeriodPage({ params }: PeriodPageProps) {
  const { periodId } = await params;
  const period = getPeriodById(periodId);

  if (!period) {
    notFound();
  }

  const artworks = sortArtworksByYear(getArtworksByPeriod(period.id));

  return (
    <PageShell
      title={period.name}
      subtitle={`${period.start_year} - ${period.end_year}`}
    >
      <EntityList
        items={artworks.map((artwork) => ({
          href: `/opera/${artwork.id}?context=period:${period.id}`,
          title: artwork.title,
          meta: formatYear(artwork),
          description:
            getAuthorById(artwork.author_id)?.name ?? "Autore non disponibile",
        }))}
        emptyLabel="Nessuna opera disponibile per questo periodo."
      />
    </PageShell>
  );
}
