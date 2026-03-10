import Link from "next/link";

type BreadcrumbSegment = {
  label: string;
  href: string;
};

type BreadcrumbProps = {
  segments: BreadcrumbSegment[];
};

export function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <li key={`${segment.href}-${segment.label}`} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-text-primary">{segment.label}</span>
              ) : (
                <Link
                  href={segment.href}
                  className="text-text-secondary transition-colors hover:text-accent"
                >
                  {segment.label}
                </Link>
              )}
              {!isLast ? <span className="text-text-secondary">&gt;</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
