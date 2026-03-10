import Link from "next/link";

type EntityListItem = {
  title: string;
  href?: string;
  meta?: string;
  description?: string;
};

type EntityListProps = {
  items: EntityListItem[];
  emptyLabel?: string;
};

export function EntityList({
  items,
  emptyLabel = "Nessun elemento disponibile.",
}: EntityListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-bg-secondary px-5 py-4 text-text-secondary">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl text-text-primary">
                {item.title}
              </h2>
              {item.meta ? (
                <span className="text-sm text-text-secondary">{item.meta}</span>
              ) : null}
            </div>
            {item.description ? (
              <p className="text-sm text-text-secondary">{item.description}</p>
            ) : null}
          </>
        );

        return (
          <li key={item.href ?? item.title}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-secondary px-5 py-4 transition-colors hover:border-accent hover:bg-[#181818]"
              >
                {content}
              </Link>
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-secondary px-5 py-4">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
