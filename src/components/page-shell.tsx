import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="min-h-screen px-6 py-16 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="space-y-4 border-b border-border pb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-accent">
            ArtèItalia
          </p>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-3xl text-base text-text-secondary sm:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
