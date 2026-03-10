import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import { authors } from "@/lib/data";

function formatLifeDates(birthYear: number | null, deathYear: number | null) {
  if (!birthYear && !deathYear) {
    return undefined;
  }

  return `${birthYear ?? "?"} - ${deathYear ?? "?"}`;
}

export default function AuthorsPage() {
  return (
    <PageShell title="Autori" subtitle="Pittori e autrici presenti nel catalogo.">
      <EntityList
        items={authors.map((author) => ({
          href: `/autori/${author.id}`,
          title: author.name,
          meta: formatLifeDates(author.birth_year, author.death_year),
        }))}
      />
    </PageShell>
  );
}
