import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { getArtworksByMovement, getPeriodById, movements } from "@/lib/data";

export default function MovementsPage() {
  const movementCards = [...movements].sort((left, right) =>
    left.name.localeCompare(right.name, "it"),
  );

  return (
    <PageShell
      title="Correnti pittoriche"
      subtitle="Movimenti artistici e relative opere presenti nel catalogo."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {movementCards.map((movement) => (
          <Link
            key={movement.id}
            href={`/correnti/${movement.id}`}
            className="flex min-h-56 flex-col justify-between rounded-3xl border border-border bg-bg-secondary p-6 transition-colors hover:border-accent"
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="font-serif text-3xl">{movement.name}</h2>
                <p className="text-sm text-text-secondary">
                  {getPeriodById(movement.period_id)?.name ?? "Periodo non disponibile"}
                </p>
              </div>
              <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
                {movement.description}
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              {getArtworksByMovement(movement.id).length} opere
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
