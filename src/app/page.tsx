import { EntityList } from "@/components/entity-list";
import { PageShell } from "@/components/page-shell";

const sections = [
  {
    href: "/regioni",
    title: "Regioni",
    description: "Esplora il catalogo partendo dalla geografia italiana.",
  },
  {
    href: "/autori",
    title: "Autori",
    description: "Naviga i pittori presenti nel catalogo.",
  },
  {
    href: "/periodi",
    title: "Periodi storici",
    description: "Sfoglia le opere attraverso le grandi epoche dell'arte.",
  },
  {
    href: "/correnti",
    title: "Correnti pittoriche",
    description: "Consulta i movimenti artistici del catalogo.",
  },
];

export default function HomePage() {
  return (
    <PageShell
      title="ArtèItalia"
      subtitle="Catalogo digitale dell'arte pittorica italiana"
    >
      <EntityList items={sections} />
    </PageShell>
  );
}
