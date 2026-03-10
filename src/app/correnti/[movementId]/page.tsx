import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkGrid } from "@/components/ArtworkGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  getArtworksByMovement,
  getMovementById,
  getPeriodById,
  movements,
  sortArtworksByYear,
} from "@/lib/data";

export const dynamicParams = false;

type MovementPageProps = {
  params: Promise<{ movementId: string }>;
};

export function generateStaticParams() {
  return movements.map((movement) => ({ movementId: movement.id }));
}

export default async function MovementPage({ params }: MovementPageProps) {
  const { movementId } = await params;
  const movement = getMovementById(movementId);

  if (!movement) {
    notFound();
  }

  const artworks = sortArtworksByYear(getArtworksByMovement(movement.id));
  const period = getPeriodById(movement.period_id);

  return (
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Correnti", href: "/correnti" },
          { label: movement.name, href: `/correnti/${movement.id}` },
        ]}
      />
      <section className="space-y-4 rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
            {movement.name}
          </h1>
          {period ? (
            <Link
              href={`/periodi/${period.id}`}
              className="text-base text-accent transition-colors hover:text-accent-hover"
            >
              {period.name}
            </Link>
          ) : null}
        </div>
        <p className="max-w-4xl leading-7 text-text-secondary">
          {movement.description}
        </p>
      </section>
      <ArtworkGrid
        artworks={artworks}
        context={`movement:${movement.id}`}
        showMovementFilter={false}
        emptyLabel="Nessuna opera disponibile per questa corrente."
      />
    </section>
  );
}
