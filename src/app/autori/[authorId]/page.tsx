import { notFound } from "next/navigation";

import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import {
  authors,
  getArtworksByAuthor,
  getAuthorById,
  getInstitutionById,
  sortArtworksByYear,
} from "@/lib/data";
import { formatYear } from "@/lib/format";

export const dynamicParams = false;

type AuthorPageProps = {
  params: Promise<{ authorId: string }>;
};

export function generateStaticParams() {
  return authors.map((author) => ({ authorId: author.id }));
}

function formatLifeDates(birthYear: number | null, deathYear: number | null) {
  if (!birthYear && !deathYear) {
    return "Biografia in catalogazione";
  }

  return `${birthYear ?? "?"} - ${deathYear ?? "?"}`;
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { authorId } = await params;
  const author = getAuthorById(authorId);

  if (!author) {
    notFound();
  }

  const artworks = sortArtworksByYear(getArtworksByAuthor(author.id));

  return (
    <PageShell
      title={author.name}
      subtitle={formatLifeDates(author.birth_year, author.death_year)}
    >
      <p className="max-w-3xl text-text-secondary">{author.bio}</p>
      <EntityList
        items={artworks.map((artwork) => ({
          href: `/opera/${artwork.id}?context=author:${author.id}`,
          title: artwork.title,
          meta: formatYear(artwork),
          description:
            getInstitutionById(artwork.institution_id)?.name ??
            "Istituzione non disponibile",
        }))}
        emptyLabel="Nessuna opera disponibile per questo autore."
      />
    </PageShell>
  );
}
