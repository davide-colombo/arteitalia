import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import { regions } from "@/lib/data";

export default function RegionsPage() {
  return (
    <PageShell
      title="Regioni"
      subtitle="Accesso al catalogo per area geografica."
    >
      <EntityList
        items={regions.map((region) => ({
          href: `/regioni/${region.id}`,
          title: region.name,
        }))}
      />
    </PageShell>
  );
}
