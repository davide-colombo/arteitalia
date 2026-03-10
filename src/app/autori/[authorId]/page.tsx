import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkGrid } from "@/components/ArtworkGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  authors,
  getArtworksByAuthor,
  getAuthorById,
  getMovementById,
  sortArtworksByYear,
} from "@/lib/data";
import { formatLifeYears } from "@/lib/format";

export const dynamicParams = false;

type AuthorPageProps = {
  params: Promise<{ authorId: string }>;
};

export function generateStaticParams() {
  return authors.map((author) => ({ authorId: author.id }));
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { authorId } = await params;
  const author = getAuthorById(authorId);

  return {
    title: author?.name ?? "Autore",
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { authorId } = await params;
  const author = getAuthorById(authorId);

  if (!author) {
    notFound();
  }

  const artworks = sortArtworksByYear(getArtworksByAuthor(author.id));
  const movementTags = author.movements
    .map((movementId) => getMovementById(movementId))
    .filter((movement): movement is NonNullable<typeof movement> => Boolean(movement));

  return (
    <section className="space-y-8">
      <Breadcrumb
        segments={[
          { label: "Autori", href: "/autori" },
          { label: author.name, href: `/autori/${author.id}` },
        ]}
      />
      <section className="space-y-5 rounded-3xl border border-border bg-bg-secondary p-6 sm:p-8">
        <div className="space-y-3">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
            {author.name}
          </h1>
          <p className="text-base text-text-secondary sm:text-lg">
            {formatLifeYears(
              author.birth_year,
              author.death_year,
              "Biografia in catalogazione",
            )}
          </p>
        </div>
        <p className="max-w-4xl leading-7 text-text-secondary">{author.bio}</p>
        {movementTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {movementTags.map((movement) => (
              <Link
                key={movement.id}
                href={`/correnti/${movement.id}`}
                className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                {movement.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      <ArtworkGrid
        artworks={artworks}
        context={`author:${author.id}`}
        showAuthorFilter={false}
        emptyLabel="Nessuna opera disponibile per questo autore."
      />
    </section>
  );
}
