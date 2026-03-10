import { ArtworkGrid } from "@/components/ArtworkGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
import { notFound } from "next/navigation";

import {
  getArtworksByPeriod,
  getPeriodById,
  periods,
  sortArtworksByYear,
} from "@/lib/data";

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
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Periodi", href: "/periodi" },
          { label: period.name, href: `/periodi/${period.id}` },
        ]}
      />
      <section className="space-y-3 rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          {period.name}
        </h1>
        <p className="text-base text-text-secondary sm:text-lg">
          {period.start_year}–{period.end_year}
        </p>
      </section>
      <ArtworkGrid
        artworks={artworks}
        context={`period:${period.id}`}
        showPeriodFilter={false}
        emptyLabel="Nessuna opera disponibile per questo periodo."
      />
    </section>
  );
}
