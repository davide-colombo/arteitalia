#!/usr/bin/env python3
"""
ArtèItalia — arricchimento mirato immagini da Wikimedia Commons.

Secondo passaggio per le 16 opere rimaste con placeholder dopo il primo run.
Riutilizza la pipeline Commons esistente: ricerca, imageinfo, verifica licenza
e aggiornamento del solo campo image in src/data/artworks.json.
"""

from __future__ import annotations

import sys
import urllib.error
from dataclasses import dataclass

from fetch_images import (
    ARTWORKS_PATH,
    AUTHORS_PATH,
    Candidate,
    candidate_score,
    fetch_file_info,
    is_good_match,
    load_json,
    normalize_image_field,
    save_artworks,
    search_files,
)


@dataclass(frozen=True)
class TargetConfig:
    queries: tuple[str, ...]
    preferred_file_title: str | None = None
    author_override: str | None = None
    copyright_blocked: bool = False


TARGET_ORDER = (
    "crocifissione-francia",
    "man-eating-chicken-bacon",
    "untitled-twombly-1959",
    "meriggio-casorati",
    "gladiatori-de-chirico",
    "storia-virginia-botticelli-carrara",
    "pala-san-bernardino-lotto",
    "san-francesco-caravaggio-cremona",
    "compenetrazione-iridescente-balla",
    "autoritratto-madre-de-chirico",
    "ciclo-mesi-torre-aquila",
    "cervino-notturno-mus",
    "distruzione-sodoma-guttuso",
    "ecce-homo-cranach-bressanone",
    "torrente-maggio-delleani",
    "giornata-vento-signorini",
)

LIKELY_FINDABLE = {
    "crocifissione-francia",
    "storia-virginia-botticelli-carrara",
    "pala-san-bernardino-lotto",
    "san-francesco-caravaggio-cremona",
    "ciclo-mesi-torre-aquila",
    "ecce-homo-cranach-bressanone",
    "torrente-maggio-delleani",
    "giornata-vento-signorini",
}

TARGETS: dict[str, TargetConfig] = {
    "crocifissione-francia": TargetConfig(
        queries=(
            "Francesco Francia Crucifixion",
            "Francesco Raibolini Crucifixion",
            "Francia Crocifissione Bologna",
        ),
        preferred_file_title=(
            "File:Francesco Francia - Crucifixion with Sts John and Jerome - "
            "WGA08167.jpg"
        ),
    ),
    "man-eating-chicken-bacon": TargetConfig(
        queries=(
            "Francis Bacon Man Eating Leg Chicken",
            "Francis Bacon 1952 painting",
        ),
        copyright_blocked=True,
    ),
    "untitled-twombly-1959": TargetConfig(
        queries=("Cy Twombly Untitled 1959",),
        copyright_blocked=True,
    ),
    "meriggio-casorati": TargetConfig(
        queries=("Felice Casorati Meriggio",),
        copyright_blocked=True,
    ),
    "gladiatori-de-chirico": TargetConfig(
        queries=("De Chirico Gladiators",),
        copyright_blocked=True,
    ),
    "storia-virginia-botticelli-carrara": TargetConfig(
        queries=(
            "Botticelli Virginia Romana",
            "Botticelli Story of Virginia",
            "Sandro Botticelli Virginia Accademia Carrara",
        ),
        preferred_file_title="File:VirginiaBotticelli.jpg",
    ),
    "pala-san-bernardino-lotto": TargetConfig(
        queries=(
            "Lorenzo Lotto Pala San Bernardino",
            "Lorenzo Lotto Martinengo altarpiece",
            "Lotto pala Bergamo 1521",
            "Giovan Battista Moroni Pala di San Bernardino",
        ),
        preferred_file_title="File:Lotto, pala martinengo 01.jpg",
        author_override="Lorenzo Lotto",
    ),
    "san-francesco-caravaggio-cremona": TargetConfig(
        queries=(
            "Caravaggio Saint Francis meditation",
            "Caravaggio San Francesco meditazione",
            "Caravaggio Francis crucifix Cremona",
        ),
        preferred_file_title="File:Saint Francis in Meditation-Caravaggio (Cremona).jpg",
    ),
    "compenetrazione-iridescente-balla": TargetConfig(
        queries=(
            "Giacomo Balla Compenetrazione iridescente",
            "Balla iridescent interpenetration",
        ),
        copyright_blocked=True,
    ),
    "autoritratto-madre-de-chirico": TargetConfig(
        queries=("De Chirico autoritratto con la madre",),
        copyright_blocked=True,
    ),
    "ciclo-mesi-torre-aquila": TargetConfig(
        queries=(
            "Ciclo dei Mesi Torre Aquila",
            "Torre Aquila cycle months Trento",
            "Maestro Venceslao months",
            "Buonconsiglio Torre Aquila",
        ),
        preferred_file_title="File:Ciclo dei mesi 00.JPG",
    ),
    "cervino-notturno-mus": TargetConfig(
        queries=("Italo Mus Cervino",),
        copyright_blocked=True,
    ),
    "distruzione-sodoma-guttuso": TargetConfig(
        queries=("Renato Guttuso Distruzione di Sodoma",),
        copyright_blocked=True,
    ),
    "ecce-homo-cranach-bressanone": TargetConfig(
        queries=(
            "Lucas Cranach Ecce Homo",
            "Cranach Ecce Homo Brixen",
            "Cranach Ecce Homo Bressanone",
        ),
        preferred_file_title=(
            "File:Lucas Cranach (I) - Christus als Schmerzensmann "
            "(Diözesanmuseum Brixen).jpg"
        ),
        author_override="Lucas Cranach the Elder",
    ),
    "torrente-maggio-delleani": TargetConfig(
        queries=(
            "Lorenzo Delleani Torrente",
            "Delleani maggio",
            "Lorenzo Delleani landscape",
        ),
    ),
    "giornata-vento-signorini": TargetConfig(
        queries=(
            "Telemaco Signorini Giornata di vento",
            "Signorini windy day",
            "Telemaco Signorini landscape",
        ),
    ),
}


def build_candidate_titles(config: TargetConfig) -> list[tuple[str, str]]:
    titles: list[tuple[str, str]] = []

    if config.preferred_file_title:
        titles.append(("preferred-file", config.preferred_file_title))

    seen_queries = set()
    for query in config.queries:
        if query in seen_queries:
            continue
        seen_queries.add(query)

        try:
            results = search_files(query)
        except urllib.error.URLError as error:
            print(f"  ! Wikimedia search failed for '{query}': {error}", file=sys.stderr)
            continue

        titles.extend((query, title) for title in results)

    return titles


def build_candidate(file_title: str, info: dict[str, object], score: float, query_used: str) -> Candidate:
    return Candidate(
        file_title=info["file_title"],
        url=info["url"],
        thumbnail=info.get("thumbnail"),
        width=info["width"],
        height=info["height"],
        mime=info["mime"],
        license=info["license"],
        attribution=info.get("attribution"),
        description=info.get("description", ""),
        score=score,
        query_used=query_used,
    )


def find_target_candidate(
    artwork: dict[str, object],
    author_name: str,
    config: TargetConfig,
) -> Candidate | None:
    best: Candidate | None = None
    seen_titles = set()

    for query_used, file_title in build_candidate_titles(config):
        if file_title in seen_titles:
            continue
        seen_titles.add(file_title)

        try:
            info = fetch_file_info(file_title)
        except urllib.error.URLError as error:
            print(f"  ! Wikimedia file lookup failed for '{file_title}': {error}", file=sys.stderr)
            continue

        if not info or not info.get("url"):
            continue

        if config.preferred_file_title and info["file_title"] == config.preferred_file_title:
            return build_candidate(file_title, info, 999.0, query_used)

        score = candidate_score(artwork, author_name, info)
        if not is_good_match(artwork, author_name, info, score):
            continue

        candidate = build_candidate(file_title, info, score, query_used)
        if best is None or candidate.score > best.score:
            best = candidate

    return best


def main() -> int:
    artworks = load_json(ARTWORKS_PATH)
    authors = {author["id"]: author["name"] for author in load_json(AUTHORS_PATH)}
    artworks_by_id = {artwork["id"]: artwork for artwork in artworks}

    changed = False
    found_this_run: list[str] = []
    still_missing: list[str] = []
    copyright_skipped: list[str] = []
    already_populated: list[str] = []

    for index, artwork_id in enumerate(TARGET_ORDER, start=1):
        artwork = artworks_by_id.get(artwork_id)
        if artwork is None:
            print(f"[{index:02d}] {artwork_id} — missing from artworks.json", file=sys.stderr)
            continue

        artwork["image"] = normalize_image_field(artwork.get("image", {}))
        config = TARGETS[artwork_id]

        print(f"[{index:02d}] {artwork_id} — {artwork['title']}")

        if artwork["image"]["source"] != "placeholder":
            print("  → already populated, skipped")
            already_populated.append(artwork_id)
            continue

        if config.copyright_blocked:
            print("  → copyright-blocked, leaving placeholder")
            copyright_skipped.append(artwork_id)
            still_missing.append(artwork_id)
            continue

        author_name = config.author_override or authors.get(
            artwork["author_id"], "Autore sconosciuto"
        )

        try:
            candidate = find_target_candidate(artwork, author_name, config)
        except Exception as error:  # pragma: no cover - defensive for network-heavy script
            print(f"  ! Failed to process artwork: {error}", file=sys.stderr)
            still_missing.append(artwork_id)
            continue

        if candidate is None:
            print("  → no reliable match found")
            still_missing.append(artwork_id)
            continue

        artwork["image"] = {
            "source": "wikimedia",
            "url": candidate.url,
            "thumbnail": candidate.thumbnail,
            "license": candidate.license,
            "attribution": candidate.attribution,
        }
        save_artworks(artworks)
        changed = True
        found_this_run.append(artwork_id)
        print(
            "  ✓ "
            f"{candidate.file_title} | {candidate.width}x{candidate.height} | "
            f"{candidate.license} | via {candidate.query_used}"
        )

    if changed:
        save_artworks(artworks)

    likely_found = [artwork_id for artwork_id in found_this_run if artwork_id in LIKELY_FINDABLE]
    likely_missing = [artwork_id for artwork_id in still_missing if artwork_id in LIKELY_FINDABLE]

    print()
    print("=" * 60)
    print("Remaining-artworks enrichment summary")
    print("=" * 60)
    print(f"Targeted artworks: {len(TARGET_ORDER)}")
    print(f"Already populated before run: {len(already_populated)}")
    print(f"Images found this run: {len(found_this_run)}")
    print(f"Copyright-blocked placeholders kept: {len(copyright_skipped)}")
    print(f"Likely-findable recovered: {len(likely_found)}/{len(LIKELY_FINDABLE)}")

    if likely_found:
        print()
        print("Recovered likely-findable artworks:")
        for artwork_id in likely_found:
            print(f"- {artwork_id}")

    if likely_missing:
        print()
        print("Still missing among likely-findable artworks:")
        for artwork_id in likely_missing:
            print(f"- {artwork_id}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
