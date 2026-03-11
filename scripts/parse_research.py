#!/usr/bin/env python3
"""
ArtèItalia — Parser per output di ricerca tabellare.

Converte il formato tabellare prodotto dal modello AI nel formato JSON
del progetto. Legge un file di testo, produce/aggiorna i JSON in src/data/.

Uso:
  python3 scripts/parse_research.py input.txt [--dry-run]

Il file input.txt deve contenere blocchi separati da "---" con il formato:
  AUTORE: ...
  NASCITA: ...
  MORTE: ...
  OPERA: ...
  ANNO: ...
  TECNICA: ...
  DIMENSIONI: ...
  COLLOCAZIONE: ...
  IN ITALIA: ...
  REGIONE: ...
  LICENZA IMMAGINE: ...
  NOTE: ...
  ---
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"


def slugify(text: str) -> str:
    """Genera un ID slug da un testo."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text


def load_json(name: str) -> list:
    path = DATA_DIR / f"{name}.json"
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return []


def save_json(name: str, data: list):
    path = DATA_DIR / f"{name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Salvato {path} ({len(data)} record)")


def parse_block(block: str) -> dict | None:
    """Parsa un singolo blocco tabellare in un dizionario."""
    fields = {}
    for line in block.strip().split("\n"):
        line = line.strip()
        if not line or line == "---":
            continue
        match = re.match(r"^([A-Z\s]+?):\s*(.*)$", line)
        if match:
            key = match.group(1).strip()
            value = match.group(2).strip()
            fields[key] = value

    if "OPERA" not in fields or "AUTORE" not in fields:
        return None
    return fields


def parse_year(anno_str: str) -> tuple:
    """
    Parsa il campo ANNO e restituisce (year, year_approximate, year_range).
    Gestisce: "1504", "1504 ca.", "1469–1470", "1469–1470 ca.",
              "ante 1500", "post 1480", "1480–1490 ca.", ecc.
    """
    if not anno_str or anno_str.lower() in ("sconosciuto", "sconosciuta", "s.d.", "n.d.", ""):
        return None, False, None

    approximate = "ca." in anno_str or "circa" in anno_str.lower()
    cleaned = anno_str.replace("ca.", "").replace("circa", "").strip()
    cleaned = re.sub(r"(ante|post|prima di|dopo il|intorno al)\s*", "", cleaned, flags=re.IGNORECASE).strip()

    # Range: "1469–1470" o "1469-1470"
    range_match = re.match(r"(\d{4})\s*[–\-]\s*(\d{4})", cleaned)
    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2))
        return None, approximate, [start, end]

    # Anno singolo
    year_match = re.match(r"(\d{4})", cleaned)
    if year_match:
        return int(year_match.group(1)), approximate, None

    return None, True, None


def year_to_period(year: int | None, year_range: list | None) -> str:
    """Determina il period_id da un anno o range."""
    y = year
    if y is None and year_range:
        y = year_range[0]
    if y is None:
        return "quattrocento"  # fallback

    if y < 1400:
        return "medioevo"
    elif y < 1500:
        return "quattrocento"
    elif y < 1600:
        return "cinquecento"
    elif y < 1700:
        return "seicento"
    elif y < 1800:
        return "settecento"
    elif y < 1900:
        return "ottocento"
    elif y < 2000:
        return "novecento"
    else:
        return "contemporaneo"


def guess_movement(author_name: str, period_id: str) -> str:
    """
    Stima la corrente pittorica in base all'autore e al periodo.
    Mapping approssimativo — può essere raffinato manualmente.
    """
    name_lower = author_name.lower()

    # Mapping specifici per autore
    author_movements = {
        "giotto": "gotico",
        "cimabue": "gotico",
        "duccio": "gotico",
        "simone martini": "gotico",
        "lorenzetti": "gotico",
        "gentile da fabriano": "gotico-internazionale",
        "masaccio": "rinascimento",
        "beato angelico": "rinascimento",
        "paolo uccello": "rinascimento",
        "botticelli": "rinascimento",
        "mantegna": "rinascimento",
        "bellini": "rinascimento",
        "antonello": "rinascimento",
        "piero della francesca": "rinascimento",
        "ghirlandaio": "rinascimento",
        "perugino": "rinascimento",
        "leonardo": "rinascimento-maturo",
        "michelangelo": "rinascimento-maturo",
        "raffaello": "rinascimento-maturo",
        "tiziano": "rinascimento-maturo",
        "giorgione": "rinascimento-maturo",
        "tintoretto": "rinascimento-maturo",
        "veronese": "rinascimento-maturo",
        "correggio": "rinascimento-maturo",
        "parmigianino": "manierismo",
        "pontormo": "manierismo",
        "rosso fiorentino": "manierismo",
        "bronzino": "manierismo",
        "caravaggio": "naturalismo",
        "artemisia": "naturalismo",
        "carracci": "barocco",
        "guido reni": "barocco",
        "guercino": "barocco",
        "domenichino": "barocco",
        "tiepolo": "barocco",
        "canaletto": "vedutismo",
        "bellotto": "vedutismo",
        "guardi": "vedutismo",
        "hayez": "romanticismo",
        "fattori": "realismo",
        "signorini": "realismo",
        "segantini": "divisionismo",
        "previati": "divisionismo",
        "pellizza": "divisionismo",
        "boccioni": "futurismo",
        "balla": "futurismo",
        "severini": "futurismo",
        "de chirico": "metafisica",
        "morandi": "metafisica",
        "modigliani": "arte-contemporanea",
        "fontana": "spazialismo",
        "burri": "informale",
        "vedova": "informale",
        "guttuso": "novecento-italiano",
        "sironi": "novecento-italiano",
        "casorati": "novecento-italiano",
        "schifano": "pop-art",
    }

    for key, movement in author_movements.items():
        if key in name_lower:
            return movement

    # Fallback per periodo
    period_fallback = {
        "medioevo": "gotico",
        "quattrocento": "rinascimento",
        "cinquecento": "rinascimento-maturo",
        "seicento": "barocco",
        "settecento": "barocco",
        "ottocento": "realismo",
        "novecento": "novecento-italiano",
        "contemporaneo": "arte-contemporanea",
    }
    return period_fallback.get(period_id, "rinascimento")


def parse_collocazione(collocazione: str) -> tuple:
    """
    Parsa il campo COLLOCAZIONE e restituisce (institution_name, city_name, country).
    Formato atteso: "Nome Museo, Città, Paese" o "Nome Museo, Città".
    """
    parts = [p.strip() for p in collocazione.split(",")]
    if len(parts) >= 3:
        return parts[0], parts[1], ", ".join(parts[2:])
    elif len(parts) == 2:
        return parts[0], parts[1], "Italia"
    else:
        return collocazione, "", "Italia"


# Mapping regione → province abbreviazioni note
REGION_CITY_MAP = {
    "firenze": ("firenze", "FI", "toscana"),
    "roma": ("roma", "RM", "lazio"),
    "napoli": ("napoli", "NA", "campania"),
    "venezia": ("venezia", "VE", "veneto"),
    "milano": ("milano", "MI", "lombardia"),
    "torino": ("torino", "TO", "piemonte"),
    "bologna": ("bologna", "BO", "emilia-romagna"),
    "ferrara": ("ferrara", "FE", "emilia-romagna"),
    "modena": ("modena", "MO", "emilia-romagna"),
    "parma": ("parma", "PR", "emilia-romagna"),
    "siena": ("siena", "SI", "toscana"),
    "perugia": ("perugia", "PG", "umbria"),
    "urbino": ("urbino", "PU", "marche"),
    "padova": ("padova", "PD", "veneto"),
    "verona": ("verona", "VR", "veneto"),
    "vicenza": ("vicenza", "VI", "veneto"),
    "genova": ("genova", "GE", "liguria"),
    "palermo": ("palermo", "PA", "sicilia"),
    "bari": ("bari", "BA", "puglia"),
    "bergamo": ("bergamo", "BG", "lombardia"),
    "brescia": ("brescia", "BS", "lombardia"),
    "mantova": ("mantova", "MN", "lombardia"),
    "cremona": ("cremona", "CR", "lombardia"),
    "pavia": ("pavia", "PV", "lombardia"),
    "piacenza": ("piacenza", "PC", "emilia-romagna"),
    "reggio emilia": ("reggio-emilia", "RE", "emilia-romagna"),
    "trieste": ("trieste", "TS", "friuli-venezia-giulia"),
    "udine": ("udine", "UD", "friuli-venezia-giulia"),
    "trento": ("trento", "TN", "trentino-alto-adige"),
    "bolzano": ("bolzano", "BZ", "trentino-alto-adige"),
    "arezzo": ("arezzo", "AR", "toscana"),
    "pisa": ("pisa", "PI", "toscana"),
    "lucca": ("lucca", "LU", "toscana"),
    "assisi": ("assisi", "PG", "umbria"),
    "orvieto": ("orvieto", "TR", "umbria"),
    "ravenna": ("ravenna", "RA", "emilia-romagna"),
    "la spezia": ("la-spezia", "SP", "liguria"),
    "savona": ("savona", "SV", "liguria"),
    "ancona": ("ancona", "AN", "marche"),
    "pesaro": ("pesaro", "PU", "marche"),
    "caserta": ("caserta", "CE", "campania"),
    "catania": ("catania", "CT", "sicilia"),
    "messina": ("messina", "ME", "sicilia"),
    "cagliari": ("cagliari", "CA", "sardegna"),
    "l'aquila": ("l-aquila", "AQ", "abruzzo"),
    "lecce": ("lecce", "LE", "puglia"),
    "cosenza": ("cosenza", "CS", "calabria"),
    "matera": ("matera", "MT", "basilicata"),
    "campobasso": ("campobasso", "CB", "molise"),
    "aosta": ("aosta", "AO", "valle-d-aosta"),
    "rovereto": ("rovereto", "TN", "trentino-alto-adige"),
    "rivoli": ("rivoli", "TO", "piemonte"),
    "vercelli": ("vercelli", "VC", "piemonte"),
    "novara": ("novara", "NO", "piemonte"),
    "asti": ("asti", "AT", "piemonte"),
    "bressanone": ("bressanone", "BZ", "trentino-alto-adige"),
    "chatillon": ("chatillon", "AO", "valle-d-aosta"),
    "pordenone": ("pordenone", "PN", "friuli-venezia-giulia"),
}


def find_or_create_city(city_name: str, region_str: str, cities: list, regions: list) -> str | None:
    """Trova o crea una città nel dataset. Restituisce il city_id."""
    city_lower = city_name.lower().strip()

    # Cerca nel mapping noto
    if city_lower in REGION_CITY_MAP:
        city_id, province, region_id = REGION_CITY_MAP[city_lower]
    else:
        city_id = slugify(city_name)
        province = ""
        # Prova a derivare la regione dal campo REGIONE
        region_id = slugify(region_str) if region_str else None
        if not region_id:
            return None

    # Verifica che la regione esista
    region_ids = {r["id"] for r in regions}
    if region_id not in region_ids:
        return None

    # Cerca se la città esiste già
    existing = next((c for c in cities if c["id"] == city_id), None)
    if existing:
        return city_id

    # Crea la città
    cities.append({
        "id": city_id,
        "name": city_name.strip(),
        "province": province,
        "region_id": region_id,
    })
    return city_id


def find_or_create_institution(inst_name: str, city_id: str, institutions: list) -> str:
    """Trova o crea un'istituzione. Restituisce institution_id."""
    inst_id = slugify(inst_name)

    existing = next((i for i in institutions if i["id"] == inst_id), None)
    if existing:
        return inst_id

    institutions.append({
        "id": inst_id,
        "name": inst_name.strip(),
        "type": "altro",
        "city_id": city_id,
        "description": "",
        "website": None,
        "periods": [],
        "movements": [],
        "notes": "Aggiunto automaticamente dal parser di ricerca.",
    })
    return inst_id


def find_or_create_author(author_name: str, birth: str, death: str,
                          movement_id: str, authors: list) -> str:
    """Trova o crea un autore. Restituisce author_id."""
    author_id = slugify(author_name)

    existing = next((a for a in authors if a["id"] == author_id), None)
    if existing:
        return author_id

    birth_year = None
    death_year = None
    try:
        birth_year = int(re.search(r"\d{4}", birth).group()) if birth else None
    except (AttributeError, ValueError):
        pass
    try:
        death_year = int(re.search(r"\d{4}", death).group()) if death else None
    except (AttributeError, ValueError):
        pass

    authors.append({
        "id": author_id,
        "name": author_name.strip(),
        "birth_year": birth_year,
        "death_year": death_year,
        "bio": "",
        "movements": [movement_id],
    })
    return author_id


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/parse_research.py input.txt [--dry-run]")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    dry_run = "--dry-run" in sys.argv

    if not input_path.exists():
        print(f"File non trovato: {input_path}")
        sys.exit(1)

    # Carica dati esistenti
    regions = load_json("regions")
    cities = load_json("cities")
    institutions = load_json("institutions")
    authors = load_json("authors")
    movements = load_json("movements")
    periods = load_json("periods")
    artworks = load_json("artworks")

    existing_artwork_ids = {a["id"] for a in artworks}
    movement_ids = {m["id"] for m in movements}

    # Leggi e parsa il file di input
    text = input_path.read_text(encoding="utf-8")
    blocks = text.split("---")

    stats = {"parsed": 0, "added": 0, "skipped_exists": 0,
             "skipped_abroad": 0, "skipped_invalid": 0}

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        fields = parse_block(block)
        if not fields:
            continue

        stats["parsed"] += 1

        # Filtra solo opere in Italia
        in_italia = fields.get("IN ITALIA", "").strip().lower()
        if in_italia not in ("sì", "si", "yes", "s"):
            stats["skipped_abroad"] += 1
            continue

        # Parsa i campi
        author_name = fields.get("AUTORE", "")
        birth = fields.get("NASCITA", "")
        death = fields.get("MORTE", "")
        title = fields.get("OPERA", "")
        anno = fields.get("ANNO", "")
        tecnica = fields.get("TECNICA", "")
        dimensioni = fields.get("DIMENSIONI", "")
        collocazione = fields.get("COLLOCAZIONE", "")
        regione = fields.get("REGIONE", "")
        licenza = fields.get("LICENZA IMMAGINE", "")
        note = fields.get("NOTE", "")

        # Genera ID opera
        author_surname = author_name.split()[-1] if author_name else ""
        artwork_id = slugify(f"{title}-{author_surname}")
        if not artwork_id:
            stats["skipped_invalid"] += 1
            continue

        # Evita duplicati
        if artwork_id in existing_artwork_ids:
            stats["skipped_exists"] += 1
            continue

        # Parsa anno
        year, year_approximate, year_range = parse_year(anno)
        period_id = year_to_period(year, year_range)
        movement_id = guess_movement(author_name, period_id)

        # Assicura che la corrente esista
        if movement_id not in movement_ids:
            movement_id = "rinascimento"  # fallback sicuro

        # Parsa collocazione
        inst_name, city_name, country = parse_collocazione(collocazione)

        # Trova/crea città
        city_id = find_or_create_city(city_name, regione, cities, regions)
        if not city_id:
            stats["skipped_invalid"] += 1
            continue

        # Trova/crea istituzione
        institution_id = find_or_create_institution(inst_name, city_id, institutions)

        # Trova/crea autore
        author_id = find_or_create_author(author_name, birth, death,
                                          movement_id, authors)

        # Crea l'opera
        artwork = {
            "id": artwork_id,
            "title": title.strip(),
            "author_id": author_id,
            "year": year,
            "year_approximate": year_approximate,
            "year_range": year_range,
            "period_id": period_id,
            "movement_id": movement_id,
            "institution_id": institution_id,
            "medium": tecnica.strip() if tecnica else None,
            "dimensions": dimensioni.strip() if dimensioni and dimensioni.lower() != "sconosciute" else None,
            "description": "",
            "image": {
                "source": "placeholder",
                "url": None,
                "thumbnail": None,
                "license": None,
                "attribution": None,
            },
            "links": [],
            "verified": False,
            "notes": note.strip() if note else None,
        }

        artworks.append(artwork)
        existing_artwork_ids.add(artwork_id)
        stats["added"] += 1

    # Report
    print()
    print("=" * 60)
    print("Parse completato")
    print("=" * 60)
    print(f"  Blocchi parsati:        {stats['parsed']}")
    print(f"  Opere aggiunte:         {stats['added']}")
    print(f"  Già esistenti (skip):   {stats['skipped_exists']}")
    print(f"  All'estero (skip):      {stats['skipped_abroad']}")
    print(f"  Non valide (skip):      {stats['skipped_invalid']}")
    print(f"  Totale opere nel DB:    {len(artworks)}")
    print(f"  Totale autori nel DB:   {len(authors)}")
    print(f"  Totale istituzioni:     {len(institutions)}")
    print(f"  Totale città:           {len(cities)}")
    print()

    if dry_run:
        print("  [DRY RUN — nessun file salvato]")
    else:
        save_json("artworks", artworks)
        save_json("authors", authors)
        save_json("institutions", institutions)
        save_json("cities", cities)
        print()
        print("  File aggiornati. Esegui 'python3 scripts/validate.py' per verificare.")


if __name__ == "__main__":
    main()
