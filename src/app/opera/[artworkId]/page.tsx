import { notFound } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import {
  artworks,
  getArtworkById,
  getAuthorById,
  getInstitutionById,
  getMovementById,
  getPeriodById,
} from "@/lib/data";

export const dynamicParams = false;

type ArtworkPageProps = {
  params: Promise<{ artworkId: string }>;
};

export function generateStaticParams() {
  return artworks.map((artwork) => ({ artworkId: artwork.id }));
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { artworkId } = await params;
  const artwork = getArtworkById(artworkId);

  if (!artwork) {
    notFound();
  }

  const author = getAuthorById(artwork.author_id);
  const institution = getInstitutionById(artwork.institution_id);
  const movement = getMovementById(artwork.movement_id);
  const period = getPeriodById(artwork.period_id);

  return (
    <PageShell
      title={artwork.title}
      subtitle={author?.name ?? "Scheda opera in preparazione"}
    >
      <dl className="grid gap-4 rounded-2xl border border-border bg-bg-secondary px-5 py-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-secondary">Istituzione</dt>
          <dd className="mt-1 text-base text-text-primary">
            {institution?.name ?? "Non disponibile"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Periodo</dt>
          <dd className="mt-1 text-base text-text-primary">
            {period?.name ?? "Non disponibile"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Corrente</dt>
          <dd className="mt-1 text-base text-text-primary">
            {movement?.name ?? "Non disponibile"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Anno</dt>
          <dd className="mt-1 text-base text-text-primary">
            {artwork.year ? String(artwork.year) : "Non disponibile"}
          </dd>
        </div>
      </dl>
    </PageShell>
  );
}
