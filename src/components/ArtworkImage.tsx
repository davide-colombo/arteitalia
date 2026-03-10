"use client";

import { useEffect, useState } from "react";

import type { ArtworkImage as ArtworkImageType } from "@/types/schema";

type ArtworkImageProps = {
  image: ArtworkImageType;
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  label?: string;
  loading?: "eager" | "lazy";
};

function Placeholder({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-border bg-bg-secondary px-4 text-center text-sm text-text-secondary ${className}`}
    >
      <span>{label}</span>
    </div>
  );
}

export function ArtworkImage({
  image,
  alt,
  className = "",
  fit = "cover",
  label = "Immagine non disponibile",
  loading = "lazy",
}: ArtworkImageProps) {
  const src = image.thumbnail ?? image.url;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <Placeholder className={className} label={label} />;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-bg-secondary ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full transition-opacity duration-500 ${
          fit === "contain" ? "object-contain" : "object-cover"
        } ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
