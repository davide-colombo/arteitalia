import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkPlaceholder } from "@/components/ArtworkPlaceholder";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  artworks,
  getArtworkById,
  getAuthorById,
  getCityByInstitutionId,
  getInstitutionById,
  getMovementById,
  getPeriodById,
  getRegionByInstitutionId,
} from "@/lib/data";
import { formatArtworkDate } from "@/lib/format";

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
  const city = institution ? getCityByInstitutionId(institution.id) : undefined;
  const region = institution
    ? getRegionByInstitutionId(institution.id)
    : undefined;
  const movement = getMovementById(artwork.movement_id);
  const period = getPeriodById(artwork.period_id);

  if (!institution || !city || !region) {
    notFound();
  }

  const description = artwork.description.trim();
  const notes = artwork.notes?.trim();

  return (
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Regioni", href: "/regioni" },
          { label: region.name, href: `/regioni/${region.id}` },
          { label: city.name, href: `/regioni/${region.id}/${city.id}` },
          {
            label: institution.name,
            href: `/regioni/${region.id}/${city.id}/${institution.id}`,
          },
          { label: artwork.title, href: `/opera/${artwork.id}` },
        ]}
      />
      <div className="space-y-8">
        <div className="mx-auto max-w-lg">
          <ArtworkPlaceholder className="aspect-[3/4] w-full text-base" />
        </div>
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-3 border-b border-border pb-6">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
              {artwork.title}
            </h1>
            {author ? (
              <Link
                href={`/autori/${author.id}`}
                className="text-base text-accent transition-colors hover:text-accent-hover"
              >
                {author.name}
              </Link>
            ) : (
              <p className="text-text-secondary">Autore sconosciuto</p>
            )}
          </header>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <dt className="text-sm text-text-secondary">Data</dt>
              <dd className="text-base text-text-primary">
                {formatArtworkDate(artwork)}
              </dd>
            </div>
            <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <dt className="text-sm text-text-secondary">Periodo</dt>
              <dd className="text-base text-text-primary">
                {period ? (
                  <Link
                    href={`/periodi/${period.id}`}
                    className="text-accent transition-colors hover:text-accent-hover"
                  >
                    {period.name}
                  </Link>
                ) : (
                  "Non disponibile"
                )}
              </dd>
            </div>
            <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <dt className="text-sm text-text-secondary">Corrente</dt>
              <dd className="text-base text-text-primary">
                {movement ? (
                  <Link
                    href={`/correnti/${movement.id}`}
                    className="text-accent transition-colors hover:text-accent-hover"
                  >
                    {movement.name}
                  </Link>
                ) : (
                  "Non disponibile"
                )}
              </dd>
            </div>
            <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <dt className="text-sm text-text-secondary">Istituzione</dt>
              <dd className="text-base text-text-primary">
                <Link
                  href={`/regioni/${region.id}/${city.id}/${institution.id}`}
                  className="text-accent transition-colors hover:text-accent-hover"
                >
                  {institution.name}
                </Link>
              </dd>
            </div>
            {artwork.medium ? (
              <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
                <dt className="text-sm text-text-secondary">Tecnica</dt>
                <dd className="text-base text-text-primary">{artwork.medium}</dd>
              </div>
            ) : null}
            {artwork.dimensions ? (
              <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
                <dt className="text-sm text-text-secondary">Dimensioni</dt>
                <dd className="text-base text-text-primary">
                  {artwork.dimensions}
                </dd>
              </div>
            ) : null}
          </dl>
          {description ? (
            <section className="space-y-2">
              <h2 className="font-serif text-2xl">Descrizione</h2>
              <p className="leading-7 text-text-secondary">{description}</p>
            </section>
          ) : null}
          {notes ? (
            <section className="space-y-2 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <h2 className="font-serif text-2xl">Note</h2>
              <p className="leading-7 text-text-secondary">{notes}</p>
            </section>
          ) : null}
          {artwork.links.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-serif text-2xl">Collegamenti esterni</h2>
              <ul className="space-y-2">
                {artwork.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent transition-colors hover:text-accent-hover"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
