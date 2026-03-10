import { AuthorDirectory } from "@/components/AuthorDirectory";
import { PageShell } from "@/components/page-shell";
import { authors, getArtworksByAuthor, getMovementById } from "@/lib/data";

export default function AuthorsPage() {
  const authorsWithArtworks = authors
    .map((author) => {
      const authorArtworks = getArtworksByAuthor(author.id);

      return {
        id: author.id,
        name: author.name,
        birthYear: author.birth_year,
        deathYear: author.death_year,
        artworkCount: authorArtworks.length,
        movements: author.movements
          .map((movementId) => getMovementById(movementId))
          .filter(
            (movement): movement is NonNullable<typeof movement> =>
              Boolean(movement),
          )
          .map((movement) => ({
            id: movement.id,
            name: movement.name,
          })),
      };
    })
    .filter((author) => author.artworkCount > 0)
    .sort((left, right) => left.name.localeCompare(right.name, "it"));

  return (
    <PageShell title="Autori" subtitle="Pittori e autrici presenti nel catalogo.">
      <AuthorDirectory authors={authorsWithArtworks} />
    </PageShell>
  );
}
