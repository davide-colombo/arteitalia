import { notFound } from "next/navigation";

import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import {
  getArtworksByMovement,
  getAuthorById,
  getMovementById,
  getPeriodById,
  movements,
  sortArtworksByYear,
} from "@/lib/data";
import { formatYear } from "@/lib/format";

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

  return (
    <PageShell
      title={movement.name}
      subtitle={getPeriodById(movement.period_id)?.name ?? "Corrente pittorica"}
    >
      <p className="max-w-3xl text-text-secondary">{movement.description}</p>
      <EntityList
        items={artworks.map((artwork) => ({
          href: `/opera/${artwork.id}?context=movement:${movement.id}`,
          title: artwork.title,
          meta: formatYear(artwork),
          description:
            getAuthorById(artwork.author_id)?.name ?? "Autore non disponibile",
        }))}
        emptyLabel="Nessuna opera disponibile per questa corrente."
      />
    </PageShell>
  );
}
