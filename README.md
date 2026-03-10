# ArtèItalia

Catalogo digitale dell'arte pittorica italiana.

Un progetto personale di [Davide Colombo](https://instagram.com/colombvo): un catalogo interattivo di opere pittoriche italiane organizzato per regione, museo, autore, periodo storico e corrente artistica.

## Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Data**: JSON files (no database)
- **Hosting**: Vercel
- **Lingua**: Italiano

## Sviluppo locale

```bash
npm install
npm run dev
```

Il sito sarà disponibile su `http://localhost:3000`.

## Struttura dati

I dati sono in `src/data/`:
- `regions.json` — 20 regioni italiane
- `cities.json` — città con musei
- `institutions.json` — musei, pinacoteche, case museo
- `authors.json` — artisti
- `movements.json` — correnti pittoriche
- `periods.json` — periodi storici
- `artworks.json` — opere (entità centrale)

## Validazione dati

```bash
python3 scripts/validate.py
```

## Licenza

Tutti i diritti riservati. Codice sorgente visibile per trasparenza; non è consentito l'uso commerciale senza autorizzazione.
