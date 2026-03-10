type ArtworkPlaceholderProps = {
  className?: string;
  label?: string;
};

export function ArtworkPlaceholder({
  className = "",
  label = "Immagine non disponibile",
}: ArtworkPlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-border bg-bg-secondary px-4 text-center text-sm text-text-secondary ${className}`}
    >
      <span>{label}</span>
    </div>
  );
}
