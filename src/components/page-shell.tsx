import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-3xl text-base text-text-secondary sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
