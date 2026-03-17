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
  priority?: boolean;
};

function getOptimizedSrc(originalSrc: string, width: number): string {
  const wikimediaPattern =
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([a-f0-9]\/[a-f0-9]{2}\/[^/]+)$/;
  const match = originalSrc.match(wikimediaPattern);
  if (!match) return originalSrc;
  const pathAndFile = match[1];
  const filename = pathAndFile.split("/").pop();
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${pathAndFile}/${width}px-${filename}`;
}

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
  label = "Galleria in allestimento",
  loading = "lazy",
  priority = false,
}: ArtworkImageProps) {
  const rawSrc = image.thumbnail ?? image.url;
  const optimizedSrc = rawSrc ? getOptimizedSrc(rawSrc, 800) : null;
  const [currentSrc, setCurrentSrc] = useState<string | null>(optimizedSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const newOptimized = rawSrc ? getOptimizedSrc(rawSrc, 800) : null;
    setCurrentSrc(newOptimized);
    setIsLoaded(false);
    setHasError(false);
  }, [rawSrc]);

  function handleError() {
    if (currentSrc && rawSrc && currentSrc !== rawSrc) {
      setCurrentSrc(rawSrc);
      setIsLoaded(false);
    } else {
      setHasError(true);
    }
  }

  if (!rawSrc || hasError) {
    return <Placeholder className={className} label={label} />;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-bg-secondary ${className}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-bg-secondary via-border/30 to-bg-secondary" />
      )}
      <img
        src={currentSrc ?? rawSrc}
        alt={alt}
        loading={priority ? "eager" : loading}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`h-full w-full transition-opacity duration-500 ${
          fit === "contain" ? "object-contain" : "object-cover"
        } ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
