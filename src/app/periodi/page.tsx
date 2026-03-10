import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";
import { periods } from "@/lib/data";

export default function PeriodsPage() {
  return (
    <PageShell
      title="Periodi storici"
      subtitle="Le principali epoche della pittura italiana presenti nel catalogo."
    >
      <EntityList
        items={periods.map((period) => ({
          href: `/periodi/${period.id}`,
          title: period.name,
          meta: `${period.start_year} - ${period.end_year}`,
        }))}
      />
    </PageShell>
  );
}
