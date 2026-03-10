import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/Breadcrumb";
import { Gallery } from "@/components/Gallery";
import {
  artworks,
  getArtworkById,
  getArtworksForContext,
  getAuthorById,
  getCityByInstitutionId,
  getInstitutionById,
  getMovementById,
  getPeriodById,
  getRegionByInstitutionId,
  parseArtworkContext,
  sortArtworksByTitle,
} from "@/lib/data";
import type { ArtworkContext } from "@/lib/data";

export const dynamicParams = false;

type ArtworkPageProps = {
  params: Promise<{ artworkId: string }>;
  searchParams: Promise<{ context?: string | string[] | undefined }>;
};

type BreadcrumbArgs = {
  context: ArtworkContext | null;
  artworkId: string;
  artworkTitle: string;
  authorId?: string;
  authorName?: string;
  cityId: string;
  cityName: string;
  institutionId: string;
  institutionName: string;
  movementId?: string;
  movementName?: string;
  periodId?: string;
  periodName?: string;
  regionId: string;
  regionName: string;
};

function buildBreadcrumbSegments({
  context,
  artworkId,
  artworkTitle,
  authorId,
  authorName,
  cityId,
  cityName,
  institutionId,
  institutionName,
  movementId,
  movementName,
  periodId,
  periodName,
  regionId,
  regionName,
}: BreadcrumbArgs) {
  if (context?.type === "author" && authorId && authorName && context.id === authorId) {
    return [
      { label: "Autori", href: "/autori" },
      { label: authorName, href: `/autori/${authorId}` },
      { label: artworkTitle, href: `/opera/${artworkId}` },
    ];
  }

  if (context?.type === "period" && periodId && periodName && context.id === periodId) {
    return [
      { label: "Periodi", href: "/periodi" },
      { label: periodName, href: `/periodi/${periodId}` },
      { label: artworkTitle, href: `/opera/${artworkId}` },
    ];
  }

  if (
    context?.type === "movement" &&
    movementId &&
    movementName &&
    context.id === movementId
  ) {
    return [
      { label: "Correnti", href: "/correnti" },
      { label: movementName, href: `/correnti/${movementId}` },
      { label: artworkTitle, href: `/opera/${artworkId}` },
    ];
  }

  return [
    { label: "Regioni", href: "/regioni" },
    { label: regionName, href: `/regioni/${regionId}` },
    { label: cityName, href: `/regioni/${regionId}/${cityId}` },
    {
      label: institutionName,
      href: `/regioni/${regionId}/${cityId}/${institutionId}`,
    },
    { label: artworkTitle, href: `/opera/${artworkId}` },
  ];
}

export function generateStaticParams() {
  return artworks.map((artwork) => ({ artworkId: artwork.id }));
}

export async function generateMetadata({
  params,
}: Pick<ArtworkPageProps, "params">): Promise<Metadata> {
  const { artworkId } = await params;
  const artwork = getArtworkById(artworkId);
  const author = artwork ? getAuthorById(artwork.author_id) : undefined;

  if (!artwork) {
    return {
      title: "Opera",
    };
  }

  return {
    title: `${artwork.title} — ${author?.name ?? "Autore sconosciuto"}`,
  };
}

export default async function ArtworkPage({
  params,
  searchParams,
}: ArtworkPageProps) {
  const { artworkId } = await params;
  const { context } = await searchParams;
  const artwork = getArtworkById(artworkId);

  if (!artwork) {
    notFound();
  }

  const parsedContext = parseArtworkContext(context);
  let contextArtworks = getArtworksForContext(parsedContext);
  let resolvedContext = parsedContext;
  let currentIndex = contextArtworks.findIndex(
    (entry) => entry.id === artwork.id,
  );

  if (currentIndex === -1) {
    resolvedContext = null;
    contextArtworks = sortArtworksByTitle(artworks);
    currentIndex = contextArtworks.findIndex((entry) => entry.id === artwork.id);
  }

  const author = getAuthorById(artwork.author_id);
  const institution = getInstitutionById(artwork.institution_id);
  const city = institution ? getCityByInstitutionId(institution.id) : undefined;
  const region = institution
    ? getRegionByInstitutionId(institution.id)
    : undefined;
  const movement = getMovementById(artwork.movement_id);
  const period = getPeriodById(artwork.period_id);

  if (!institution || !city || !region) {
    notFound();
  }

  const breadcrumbSegments = buildBreadcrumbSegments({
    context: resolvedContext,
    artworkId: artwork.id,
    artworkTitle: artwork.title,
    authorId: author?.id,
    authorName: author?.name,
    cityId: city.id,
    cityName: city.name,
    institutionId: institution.id,
    institutionName: institution.name,
    movementId: movement?.id,
    movementName: movement?.name,
    periodId: period?.id,
    periodName: period?.name,
    regionId: region.id,
    regionName: region.name,
  });

  return (
    <section className="space-y-8">
      <Breadcrumb segments={breadcrumbSegments} />
      <Suspense fallback={null}>
        <Gallery
          currentArtwork={artwork}
          contextArtworks={contextArtworks}
          currentIndex={currentIndex}
        />
      </Suspense>
    </section>
  );
}
