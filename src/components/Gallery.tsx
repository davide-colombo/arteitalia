"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { ArtworkImage } from "@/components/ArtworkImage";
import { ShareBarBottom } from "@/components/ShareBarBottom";
import { ShareButtonCompact } from "@/components/ShareButtonCompact";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ShareIcons";
import {
  getAuthorById,
  getCityByInstitutionId,
  getInstitutionById,
  getMovementById,
  getPeriodById,
  getRegionByInstitutionId,
} from "@/lib/data";
import { formatYear } from "@/lib/format";
import type { Artwork } from "@/types/schema";

export interface GalleryProps {
  currentArtwork: Artwork;
  contextArtworks: Artwork[];
  currentIndex: number;
}

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

export function Gallery({
  currentArtwork,
  contextArtworks,
  currentIndex,
}: GalleryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalArtworks = contextArtworks.length;
  const canNavigate = totalArtworks > 1;
  const previousArtwork = canNavigate
    ? contextArtworks[wrapIndex(currentIndex - 1, totalArtworks)]
    : null;
  const nextArtwork = canNavigate
    ? contextArtworks[wrapIndex(currentIndex + 1, totalArtworks)]
    : null;
  const author = getAuthorById(currentArtwork.author_id);
  const institution = getInstitutionById(currentArtwork.institution_id);
  const city = institution ? getCityByInstitutionId(institution.id) : undefined;
  const region = institution
    ? getRegionByInstitutionId(institution.id)
    : undefined;
  const period = getPeriodById(currentArtwork.period_id);
  const movement = getMovementById(currentArtwork.movement_id);
  const description = currentArtwork.description.trim();
  const notes = currentArtwork.notes?.trim();
  const contextParam = searchParams.get("context");
  const shareDescription = `"${currentArtwork.title}" di ${
    author?.name ?? "Autore sconosciuto"
  }, ${formatYear(currentArtwork)}`;

  function buildArtworkHref(targetArtworkId: string) {
    const targetPath = pathname.replace(
      /\/opera\/[^/]+$/,
      `/opera/${targetArtworkId}`,
    );
    const nextParams = new URLSearchParams(searchParams.toString());

    if (contextParam) {
      nextParams.set("context", contextParam);
    } else {
      nextParams.delete("context");
    }

    const query = nextParams.toString();

    return query ? `${targetPath}?${query}` : targetPath;
  }

  function navigateTo(targetArtworkId: string) {
    router.push(buildArtworkHref(targetArtworkId));
  }

  function navigateBy(offset: -1 | 1) {
    if (!canNavigate) {
      return;
    }

    const targetIndex = wrapIndex(currentIndex + offset, totalArtworks);
    const targetArtwork = contextArtworks[targetIndex];

    navigateTo(targetArtwork.id);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateBy(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateBy(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <section className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-bg-secondary p-4 sm:p-6 lg:p-8">
        <div className="hidden items-center gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
          {canNavigate && previousArtwork ? (
            <button
              type="button"
              onClick={() => navigateTo(previousArtwork.id)}
              className="flex h-full scale-[0.85] flex-col items-center gap-4 rounded-[2rem] border border-border/60 bg-bg-primary/40 p-4 text-left opacity-30 transition-all duration-300 ease-in-out hover:border-accent hover:opacity-60"
              aria-label={`Vai all'opera precedente: ${previousArtwork.title}`}
            >
              <ArtworkImage
                image={previousArtwork.image}
                alt={previousArtwork.title}
                className="aspect-[3/4] w-full"
                fit="contain"
              />
              <div className="space-y-1 text-center">
                <p className="font-serif text-xl text-text-primary">
                  {previousArtwork.title}
                </p>
                <p className="text-sm text-text-secondary">
                  {formatYear(previousArtwork)}
                </p>
              </div>
            </button>
          ) : (
            <div />
          )}

          <div className="space-y-5">
            <div className="mx-auto w-full max-w-[min(100%,32rem)] transition-all duration-300 ease-in-out">
              <ArtworkImage
                image={currentArtwork.image}
                alt={currentArtwork.title}
                className="aspect-[3/4] max-h-[70vh] w-full"
                fit="contain"
                label="Immagine non disponibile"
              />
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigateBy(-1)}
                disabled={!canNavigate}
                className="rounded-full border border-border bg-bg-primary px-4 py-2 text-lg transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Opera precedente"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => navigateBy(1)}
                disabled={!canNavigate}
                className="rounded-full border border-border bg-bg-primary px-4 py-2 text-lg transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Opera successiva"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-center text-sm text-text-secondary">
              {currentIndex + 1} / {totalArtworks}
            </p>
          </div>

          {canNavigate && nextArtwork ? (
            <button
              type="button"
              onClick={() => navigateTo(nextArtwork.id)}
              className="flex h-full scale-[0.85] flex-col items-center gap-4 rounded-[2rem] border border-border/60 bg-bg-primary/40 p-4 text-left opacity-30 transition-all duration-300 ease-in-out hover:border-accent hover:opacity-60"
              aria-label={`Vai all'opera successiva: ${nextArtwork.title}`}
            >
              <ArtworkImage
                image={nextArtwork.image}
                alt={nextArtwork.title}
                className="aspect-[3/4] w-full"
                fit="contain"
              />
              <div className="space-y-1 text-center">
                <p className="font-serif text-xl text-text-primary">
                  {nextArtwork.title}
                </p>
                <p className="text-sm text-text-secondary">
                  {formatYear(nextArtwork)}
                </p>
              </div>
            </button>
          ) : (
            <div />
          )}
        </div>

        <div className="space-y-5 lg:hidden">
          <div className="relative mx-auto w-full max-w-[min(100%,28rem)]">
            <ArtworkImage
              image={currentArtwork.image}
              alt={currentArtwork.title}
              className="aspect-[3/4] max-h-[70vh] w-full"
              fit="contain"
              label="Immagine non disponibile"
            />
            {canNavigate ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateBy(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-primary/90 px-3 py-2 text-lg transition-colors hover:border-accent hover:text-accent"
                  aria-label="Opera precedente"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateBy(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-primary/90 px-3 py-2 text-lg transition-colors hover:border-accent hover:text-accent"
                  aria-label="Opera successiva"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>
          <p className="text-center text-sm text-text-secondary">
            {currentIndex + 1} / {totalArtworks}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-3 border-b border-border pb-6">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {currentArtwork.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-text-secondary">
            {author ? (
              <Link
                href={`/autori/${author.id}`}
                className="text-accent transition-colors hover:text-accent-hover"
              >
                {author.name}
              </Link>
            ) : (
              <span>Autore sconosciuto</span>
            )}
            <span>·</span>
            <span>{formatYear(currentArtwork)}</span>
            {currentArtwork.medium ? (
              <>
                <span>·</span>
                <span>{currentArtwork.medium}</span>
              </>
            ) : null}
            <div className="ml-auto">
              <ShareButtonCompact
                title={currentArtwork.title}
                description={shareDescription}
              />
            </div>
          </div>
          {institution && city && region ? (
            <p className="text-base text-text-secondary">
              <Link
                href={`/regioni/${region.id}/${city.id}/${institution.id}`}
                className="text-accent transition-colors hover:text-accent-hover"
              >
                {institution.name}
              </Link>{" "}
              — {city.name}, {region.name}
            </p>
          ) : null}
        </header>

        <dl className="grid gap-4 sm:grid-cols-2">
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
          {currentArtwork.dimensions ? (
            <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <dt className="text-sm text-text-secondary">Dimensioni</dt>
              <dd className="text-base text-text-primary">
                {currentArtwork.dimensions}
              </dd>
            </div>
          ) : null}
          {institution ? (
            <div className="space-y-1 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
              <dt className="text-sm text-text-secondary">Museo</dt>
              <dd className="text-base text-text-primary">{institution.name}</dd>
            </div>
          ) : null}
        </dl>

        {description ? (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl">Descrizione</h2>
            {description.length > 340 ? (
              <details className="rounded-2xl border border-border bg-bg-secondary px-5 py-4 text-text-secondary">
                <summary className="cursor-pointer list-none font-medium text-text-primary">
                  Leggi la descrizione
                </summary>
                <p className="mt-4 leading-7">{description}</p>
              </details>
            ) : (
              <p className="leading-7 text-text-secondary">{description}</p>
            )}
          </section>
        ) : null}

        {notes ? (
          <section className="space-y-2 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
            <h2 className="font-serif text-2xl">Note</h2>
            <p className="leading-7 text-text-secondary">{notes}</p>
          </section>
        ) : null}

        {currentArtwork.links.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl">Collegamenti esterni</h2>
            <ul className="space-y-2">
              {currentArtwork.links.map((link) => (
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

        <ShareBarBottom
          title={currentArtwork.title}
          description={shareDescription}
          callToAction="Conosci qualcuno a cui piacerebbe quest'opera? Condividila."
        />
      </section>
    </section>
  );
}
