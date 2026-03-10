import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-serif text-4xl sm:text-5xl">Pagina non trovata</h1>
      <p className="max-w-xl text-text-secondary">
        Il percorso richiesto non esiste o non è ancora stato censito nel catalogo.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-border bg-bg-secondary px-5 py-3 text-text-primary transition-colors hover:border-accent hover:text-accent"
      >
        Torna alla home
      </Link>
    </section>
  );
}
