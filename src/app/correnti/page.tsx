import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import { getPeriodById, movements } from "@/lib/data";

export default function MovementsPage() {
  return (
    <PageShell
      title="Correnti pittoriche"
      subtitle="Movimenti artistici e relative opere presenti nel catalogo."
    >
      <EntityList
        items={movements.map((movement) => ({
          href: `/correnti/${movement.id}`,
          title: movement.name,
          meta: getPeriodById(movement.period_id)?.name,
        }))}
      />
    </PageShell>
  );
}
