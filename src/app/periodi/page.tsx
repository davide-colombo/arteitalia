import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { getArtworksByPeriod, periods } from "@/lib/data";

export default function PeriodsPage() {
  const periodCards = [...periods].sort(
    (left, right) => left.start_year - right.start_year,
  );

  return (
    <PageShell
      title="Periodi storici"
      subtitle="Le principali epoche della pittura italiana presenti nel catalogo."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {periodCards.map((period) => (
          <Link
            key={period.id}
            href={`/periodi/${period.id}`}
            className="flex min-h-48 flex-col justify-between rounded-3xl border border-border bg-bg-secondary p-6 transition-colors hover:border-accent"
          >
            <div className="space-y-2">
              <h2 className="font-serif text-3xl">{period.name}</h2>
              <p className="text-sm text-text-secondary">
                {period.start_year}–{period.end_year}
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              {getArtworksByPeriod(period.id).length} opere
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
