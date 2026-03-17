import Link from "next/link";

import { ArtworkImage } from "@/components/ArtworkImage";
import { ShareBarBottom } from "@/components/ShareBarBottom";
import {
  artworks,
  authors,
  getArtworkById,
  getArtworksByAuthor,
  getArtworksByMovement,
  getAuthorById,
  institutions,
  movements,
  regions,
} from "@/lib/data";
import { formatYear } from "@/lib/format";

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M12 21s6-5.4 6-11a6 6 0 10-12 0c0 5.6 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 100 18h1a3 3 0 000-6h-1a2 2 0 010-4h4a3 3 0 003-3A5 5 0 0014 3h-2z" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="14" cy="7.5" r="1" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M7 3h10" />
      <path d="M7 21h10" />
      <path d="M8 3c0 4 4 5 4 9s-4 5-4 9" />
      <path d="M16 3c0 4-4 5-4 9s4 5 4 9" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M4 20c1.5 0 2.5-.5 3.5-1.5S9 16.5 9 15l6-6 3 3-6 6c-1.5 0-2.5.5-3.5 1.5S5.5 20 4 20z" />
      <path d="M14 7l3-3 3 3-3 3" />
    </svg>
  );
}

export default function HomePage() {
  const featuredArtwork = getArtworkById("sposalizio-vergine-raffaello");
  const featuredAuthor = featuredArtwork
    ? getAuthorById(featuredArtwork.author_id)
    : undefined;
  const authorCount = authors.filter(
    (author) => getArtworksByAuthor(author.id).length > 0,
  ).length;
  const movementCount = movements.filter(
    (movement) => getArtworksByMovement(movement.id).length > 0,
  ).length;

  if (!featuredArtwork || !featuredAuthor) {
    return null;
  }

  return (
    <div className="-mx-4 -mt-8 space-y-24 md:-mx-8 lg:-mx-16">
      <section className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0A0A0A] to-[#111111] px-4 py-16 md:px-8 lg:px-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <h1 className="font-serif text-5xl leading-none text-text-primary md:text-7xl lg:text-8xl">
              ArtèItalia
            </h1>
            <p className="text-lg text-text-secondary">
              Il patrimonio pittorico italiano, un&apos;opera alla volta.
            </p>
          </div>

          <Link
            href="/opera/sposalizio-vergine-raffaello"
            className="group flex w-full max-w-md flex-col gap-5 rounded-[2rem] border border-accent/60 bg-bg-secondary/70 p-6 shadow-[0_0_0_1px_rgba(196,162,101,0.18),0_0_42px_rgba(196,162,101,0.08)] transition-colors hover:border-accent"
          >
            <ArtworkImage
              image={featuredArtwork.image}
              alt={featuredArtwork.title}
              className="aspect-[3/4] w-full"
              fit="cover"
              label="Immagine non disponibile"
            />
            <div className="space-y-2 text-left">
              <h2 className="font-serif text-3xl leading-tight text-text-primary">
                {featuredArtwork.title}
              </h2>
              <p className="text-sm text-text-secondary">
                {featuredAuthor.name} · {formatYear(featuredArtwork)}
              </p>
            </div>
          </Link>
        </div>

        <a
          href="#scopri"
          className="absolute bottom-8 flex flex-col items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <span>Scopri</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 animate-bounce"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      <section id="scopri" className="mx-auto max-w-4xl px-4 py-4 text-center md:px-8 lg:px-16">
        <div className="space-y-5">
          <h2 className="font-serif text-3xl text-text-primary">
            Un catalogo dell&apos;arte pittorica italiana.
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-secondary">
            <p>
              L&apos;Italia custodisce un patrimonio pittorico distribuito in
              centinaia di musei, dalla Val d&apos;Aosta alla Sicilia. Nonostante
              questo, manca uno strumento digitale che lo renda navigabile in modo
              strutturato: per regione, città, museo, autore, periodo storico,
              corrente artistica.
            </p>
            <p>
              ArtèItalia è quello strumento. Raccoglie le opere della pittura
              italiana e le rende esplorabili: puoi partire da una regione e
              arrivare al museo, oppure da un autore e attraversare i secoli.
              Ogni istituzione ha il proprio collegamento, ogni opera la propria
              scheda.
            </p>
          </div>
        </div>
        <div className="mt-12 space-y-5">
          <h3 className="font-serif text-2xl text-text-primary">
            Un progetto indipendente
          </h3>
          <p className="text-base leading-relaxed text-text-secondary">
            ArtèItalia è gratuito, senza pubblicità e senza tracciamento. Nasce
            dal lavoro di una sola persona, fuori da qualsiasi contesto
            istituzionale. Se pensi che possa essere utile a qualcuno,
            condividilo.
          </p>
          <ShareBarBottom
            title="ArtèItalia"
            description="Il patrimonio pittorico italiano, un'opera alla volta."
            callToAction=""
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-4 md:px-8 lg:px-16">
        <h2 className="text-center font-serif text-3xl text-text-primary">
          Esplora
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/regioni"
            className="flex min-h-56 flex-col justify-between rounded-xl border border-border bg-bg-secondary p-8 transition-colors hover:border-accent"
          >
            <div className="space-y-4">
              <div className="text-accent">
                <MapPinIcon />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl">Per regione</h3>
                <p className="text-sm leading-6 text-text-secondary">
                  {regions.length} regioni, {institutions.length} musei
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/autori"
            className="flex min-h-56 flex-col justify-between rounded-xl border border-border bg-bg-secondary p-8 transition-colors hover:border-accent"
          >
            <div className="space-y-4">
              <div className="text-accent">
                <PaletteIcon />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl">Per autore</h3>
                <p className="text-sm leading-6 text-text-secondary">
                  {authorCount} artisti
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/periodi"
            className="flex min-h-56 flex-col justify-between rounded-xl border border-border bg-bg-secondary p-8 transition-colors hover:border-accent"
          >
            <div className="space-y-4">
              <div className="text-accent">
                <HourglassIcon />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl">Per periodo</h3>
                <p className="text-sm leading-6 text-text-secondary">
                  Dal Medioevo al contemporaneo
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/correnti"
            className="flex min-h-56 flex-col justify-between rounded-xl border border-border bg-bg-secondary p-8 transition-colors hover:border-accent"
          >
            <div className="space-y-4">
              <div className="text-accent">
                <BrushIcon />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl">Per corrente</h3>
                <p className="text-sm leading-6 text-text-secondary">
                  {movementCount} correnti pittoriche
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-8 md:px-8 lg:px-16">
        <div className="grid gap-4 rounded-2xl border border-border bg-bg-secondary/70 px-6 py-5 text-center sm:grid-cols-2 lg:grid-cols-4">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent">{artworks.length}</span>{" "}
            opere
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent">{institutions.length}</span>{" "}
            musei
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent">{authorCount}</span>{" "}
            artisti
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent">{regions.length}</span>{" "}
            regioni
          </p>
        </div>
      </section>
    </div>
  );
}
