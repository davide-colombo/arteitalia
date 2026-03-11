#!/usr/bin/env python3
"""
ArtèItalia — arricchimento immagini da Wikimedia Commons.

Aggiorna src/data/artworks.json sostituendo le immagini placeholder con
immagini reali da Wikimedia Commons quando trova un match affidabile e con
licenza compatibile.
"""

from __future__ import annotations

import html
import json
import re
import ssl
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"
ARTWORKS_PATH = DATA_DIR / "artworks.json"
AUTHORS_PATH = DATA_DIR / "authors.json"

USER_AGENT = (
    "ArtèItalia/1.0 "
    "(https://github.com/davide-colombo/arteitalia; davide@example.com)"
)
API_URL = "https://commons.wikimedia.org/w/api.php"
REQUEST_DELAY_SECONDS = 1.0
THUMB_WIDTH = 1600
SSL_CONTEXT: ssl.SSLContext | None = None

KNOWN_FILENAMES = {
    "camera-giganti-giulio-romano": "File:Camera-dei-giganti-ceiling-mantova.jpg",
    "camera-sposi-mantegna": "File:Andrea Mantegna - Camera picta, la corte 01.jpg",
    "canestra-frutta-caravaggio": "File:Canestra di frutta (Caravaggio).jpg",
    "cartone-preparatorio-per-la-scuola-di-atene-sanzio": "File:Ambrosiana-Raffaello-Sanzio-La-Scuola-di-Atene-cartone-prepa.jpg",
    "cristo-morto-mantegna": "File:Andrea Mantegna - The Dead Christ.jpg",
    "estasi-santa-cecilia-raffaello": "File:Raphael - The Ecstasy of St Cecilia.jpg",
    "madonna-col-bambino-madonna-del-padiglione-botticelli": "File:Sandro Botticelli - The Virgin and Child with Three Angels (Madonna del Padiglione) - WGA02836.jpg",
    "giudizio-salomone-tiepolo": "File:Tiepolo - Giudizio di Salomone, 408829.jpg",
    "il-bacio-hayez": "File:Francesco Hayez 008.jpg",
    "nettuno-offre-a-venezia-le-ricchezze-del-mare-tiepolo": "File:Giambattista Tiepolo - Venezia riceve l'omaggio di Nettuno - 1745-50.jpg",
    "pala-montefeltro-piero": "File:Piero, Pala di Brera 01.jpg",
    "profeta-isaia-buonarroti": "File:Jesaja (Michelangelo).jpg",
    "ragazzo-con-canestro-di-frutta-caravaggio": "File:Boy with a Basket of Fruit-Caravaggio (1593).jpg",
    "ritratto-lambertini-crespi": "File:Prospero Lambertini by Giuseppe Maria Crespi.jpg",
    "ritratto-musico-leonardo": "File:Leonardo da Vinci - Portrait of a Musician.jpg",
    "ritratto-signora-klimt": "File:Gustav-Klimt, Portrait of a Lady, 1917, Galleria d'Arte Moderna Ricci Oddi.jpg",
    "sacra-famiglia-con-santanna-e-san-giovanni-battista-luini": "File:B Luini Sacra Famiglia con S Giovannino S Anna Milano Ambrosiana.jpg",
    "salone-dei-mesi-schifanoia": "File:Palazzo schifanoia, salone dei mesi 01.JPG",
    "san-sebastiano-raffaello-carrara": "File:Raffaello Sanzio - St Sebastian - WGA18601.jpg",
    "scapigliata-leonardo": "File:Leonardo da Vinci - Scapigliata.jpg",
    "sposalizio-vergine-raffaello": "File:Raffaello - Spozalizio - Web Gallery of Art.jpg",
    "trittico-modena-el-greco": "File:The Modena Triptych.jpg",
}

ENGLISH_TITLE_OVERRIDES = {
    "cristo-morto-mantegna": "The Dead Christ",
    "estasi-santa-cecilia-raffaello": "The Ecstasy of Saint Cecilia",
    "il-bacio-hayez": "The Kiss",
    "ritratto-musico-leonardo": "Portrait of a Musician",
    "scapigliata-leonardo": "Scapigliata",
    "sposalizio-vergine-raffaello": "Marriage of the Virgin",
}

NAME_PARTICLES = {
    "da",
    "de",
    "dei",
    "del",
    "della",
    "di",
    "du",
    "il",
    "la",
    "le",
    "lo",
    "van",
    "von",
}

STOPWORDS = {
    "a",
    "al",
    "alla",
    "allo",
    "and",
    "con",
    "da",
    "dei",
    "del",
    "della",
    "delle",
    "dello",
    "di",
    "e",
    "ed",
    "for",
    "fra",
    "il",
    "in",
    "la",
    "le",
    "lo",
    "nel",
    "nella",
    "of",
    "on",
    "per",
    "san",
    "santa",
    "saint",
    "st",
    "the",
    "tra",
    "with",
}

PENALTY_TOKENS = {
    "altarpiece",
    "boy",
    "cappella",
    "ceiling",
    "detail",
    "dettaglio",
    "fragment",
    "frammento",
    "gallery",
    "galleria",
    "giovane",
    "interior",
    "interno",
    "museum",
    "museo",
    "particolare",
    "room",
    "sala",
    "youth",
    "young",
}

ALLOWED_LICENSE_PATTERNS = (
    "public domain",
    "cc0",
    "cc by",
    "cc-by",
    "cc by-sa",
    "cc-by-sa",
)

GENERIC_TITLES = {"untitled"}
SKIP_IDS = {
    "ecce-homo-cranach-bressanone",
    "untitled-twombly-1959",
}

last_request_at = 0.0


@dataclass
class Candidate:
    file_title: str
    url: str
    thumbnail: str | None
    width: int
    height: int
    mime: str
    license: str
    attribution: str | None
    description: str
    score: float
    query_used: str


def load_json(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_artworks(artworks: list[dict[str, Any]]) -> None:
    with ARTWORKS_PATH.open("w", encoding="utf-8") as handle:
        json.dump(artworks, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def strip_html(value: str | None) -> str:
    if not value:
        return ""

    text = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", " ", ascii_text)
    return re.sub(r"\s+", " ", ascii_text).strip()


def extract_keywords(value: str) -> list[str]:
    normalized = normalize_text(value)
    tokens: list[str] = []

    for token in normalized.split():
        if len(token) <= 2 or token in STOPWORDS:
            continue
        tokens.append(token)

    return tokens


def author_aliases(author_name: str) -> list[str]:
    primary = author_name.split("(")[0].strip()
    aliases = [primary]

    tokens = primary.split()
    if tokens:
        aliases.append(tokens[-1])

        filtered = [token for token in tokens if token.lower() not in NAME_PARTICLES]
        if filtered:
            aliases.append(filtered[-1])

    aliases.append(author_name)

    deduped: list[str] = []
    seen = set()
    for alias in aliases:
        alias = alias.strip()
        key = normalize_text(alias)
        if alias and key and key not in seen:
            deduped.append(alias)
            seen.add(key)

    return deduped


def throttle() -> None:
    global last_request_at

    now = time.monotonic()
    if last_request_at:
        elapsed = now - last_request_at
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)

    last_request_at = time.monotonic()


def get_ssl_context() -> ssl.SSLContext:
    global SSL_CONTEXT
    if SSL_CONTEXT is not None:
        return SSL_CONTEXT

    cafile_candidates = [
        "/etc/ssl/cert.pem",
        "/private/etc/ssl/cert.pem",
        "/opt/homebrew/etc/openssl@3/cert.pem",
    ]
    for cafile in cafile_candidates:
        if Path(cafile).exists():
            SSL_CONTEXT = ssl.create_default_context(cafile=cafile)
            return SSL_CONTEXT

    SSL_CONTEXT = ssl.create_default_context()
    return SSL_CONTEXT


def commons_request(params: dict[str, Any]) -> dict[str, Any]:
    throttle()

    query_params = {
        "format": "json",
        "formatversion": 2,
        **params,
    }
    url = f"{API_URL}?{urllib.parse.urlencode(query_params)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    with urllib.request.urlopen(
        request,
        timeout=60,
        context=get_ssl_context(),
    ) as response:
        return json.load(response)


def search_files(query: str) -> list[str]:
    payload = commons_request(
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srnamespace": 6,
            "srlimit": 5,
        }
    )
    return [item["title"] for item in payload.get("query", {}).get("search", [])]


def normalize_image_field(image: dict[str, Any]) -> dict[str, Any]:
    return {
        "source": image.get("source", "placeholder"),
        "url": image.get("url"),
        "thumbnail": image.get("thumbnail"),
        "license": image.get("license"),
        "attribution": image.get("attribution"),
    }


def has_allowed_license(license_name: str) -> bool:
    normalized = normalize_text(license_name)
    return any(pattern in normalized for pattern in ALLOWED_LICENSE_PATTERNS)


def fetch_file_info(file_title: str) -> dict[str, Any] | None:
    payload = commons_request(
        {
            "action": "query",
            "titles": file_title,
            "redirects": 1,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": THUMB_WIDTH,
        }
    )
    pages = payload.get("query", {}).get("pages", [])
    if not pages:
        return None

    page = pages[0]
    imageinfo = page.get("imageinfo", [])
    if not imageinfo:
        return None

    info = imageinfo[0]
    mime = info.get("mime", "")
    if not mime.startswith("image/"):
        return None

    metadata = info.get("extmetadata", {})
    license_name = strip_html(metadata.get("LicenseShortName", {}).get("value"))
    if not has_allowed_license(license_name):
        return None

    return {
        "file_title": page.get("title", file_title),
        "url": info.get("url"),
        "thumbnail": info.get("thumburl"),
        "width": info.get("width") or 0,
        "height": info.get("height") or 0,
        "mime": mime,
        "license": license_name,
        "attribution": strip_html(metadata.get("Artist", {}).get("value")) or None,
        "description": strip_html(
            metadata.get("ObjectName", {}).get("value")
            or metadata.get("ImageDescription", {}).get("value")
        ),
    }


def token_overlap_score(source_tokens: list[str], candidate_text: str) -> tuple[int, float]:
    if not source_tokens:
        return 0, 0.0

    matches = sum(1 for token in source_tokens if token in candidate_text)
    return matches, matches / len(source_tokens)


def candidate_score(
    artwork: dict[str, Any],
    author_name: str,
    candidate: dict[str, Any],
) -> float:
    filename = candidate["file_title"].removeprefix("File:")
    filename_no_ext = re.sub(r"\.[A-Za-z0-9]{2,5}$", "", filename)
    filename_text = normalize_text(filename_no_ext)
    description_text = normalize_text(candidate.get("description", ""))
    attribution_text = normalize_text(candidate.get("attribution", "") or "")
    combined_text = " ".join(
        piece for piece in [filename_text, description_text, attribution_text] if piece
    )

    title_text = normalize_text(artwork["title"])
    english_text = normalize_text(ENGLISH_TITLE_OVERRIDES.get(artwork["id"], ""))
    title_tokens = extract_keywords(artwork["title"])
    english_tokens = extract_keywords(ENGLISH_TITLE_OVERRIDES.get(artwork["id"], ""))
    author_tokens = extract_keywords(" ".join(author_aliases(author_name)))
    artwork_tokens = set(title_tokens + english_tokens)

    title_matches, title_ratio = token_overlap_score(title_tokens, combined_text)
    english_matches, english_ratio = token_overlap_score(english_tokens, combined_text)
    author_matches, author_ratio = token_overlap_score(author_tokens, combined_text)

    score = 0.0
    score += title_matches * 3.0
    score += title_ratio * 8.0
    score += english_matches * 2.5
    score += english_ratio * 5.0
    score += author_matches * 2.0
    score += author_ratio * 4.0

    if title_text and title_text in filename_text:
        score += 10.0
    if english_text and english_text in filename_text:
        score += 8.0

    similarity_inputs = [text for text in [title_text, english_text] if text]
    if similarity_inputs:
        score += max(
            SequenceMatcher(None, filename_text, candidate_text).ratio()
            for candidate_text in similarity_inputs
        ) * 6.0

    if author_tokens and any(token in filename_text for token in author_tokens):
        score += 2.5

    for token in PENALTY_TOKENS:
        if token in filename_text and token not in artwork_tokens:
            score -= 3.0

    resolution = candidate["width"] * candidate["height"]
    if resolution:
        score += min(resolution / 5_000_000, 3.0)

    return score


def is_good_match(
    artwork: dict[str, Any],
    author_name: str,
    candidate: dict[str, Any],
    score: float,
) -> bool:
    normalized_title = normalize_text(artwork["title"])
    if normalized_title in GENERIC_TITLES and artwork["id"] not in KNOWN_FILENAMES:
        return False

    title_tokens = extract_keywords(artwork["title"])
    english_tokens = extract_keywords(ENGLISH_TITLE_OVERRIDES.get(artwork["id"], ""))
    author_tokens = extract_keywords(" ".join(author_aliases(author_name)))

    candidate_text = normalize_text(
        " ".join(
            [
                candidate["file_title"],
                candidate.get("description", ""),
                candidate.get("attribution", "") or "",
            ]
        )
    )

    title_matches = sum(1 for token in title_tokens if token in candidate_text)
    english_matches = sum(1 for token in english_tokens if token in candidate_text)
    author_matches = sum(1 for token in author_tokens if token in candidate_text)

    title_text = normalize_text(artwork["title"])
    english_text = normalize_text(ENGLISH_TITLE_OVERRIDES.get(artwork["id"], ""))
    filename_text = normalize_text(candidate["file_title"])
    best_similarity = max(
        [0.0]
        + [
            SequenceMatcher(None, filename_text, target).ratio()
            for target in [title_text, english_text]
            if target
        ]
    )

    if artwork["id"] in KNOWN_FILENAMES and candidate["file_title"] == KNOWN_FILENAMES[artwork["id"]]:
        return True

    has_title_signal = (
        title_matches >= max(1, min(2, len(title_tokens)))
        or english_matches >= 1
        or (title_text and title_text in candidate_text)
        or (english_text and english_text in candidate_text)
        or best_similarity >= 0.5
    )
    has_author_signal = author_matches >= 1 or best_similarity >= 0.65

    return has_title_signal and has_author_signal and score >= 8.0


def build_queries(artwork: dict[str, Any], author_name: str) -> list[str]:
    queries: list[str] = []
    aliases = author_aliases(author_name)
    primary_alias = aliases[0]
    surname_alias = aliases[1] if len(aliases) > 1 else primary_alias

    queries.append(f"{artwork['title']} {surname_alias}".strip())
    if primary_alias != surname_alias:
        queries.append(f"{artwork['title']} {primary_alias}".strip())

    english_title = ENGLISH_TITLE_OVERRIDES.get(artwork["id"])
    if english_title:
        queries.append(f"{english_title} {surname_alias}".strip())
        if primary_alias != surname_alias:
            queries.append(f"{english_title} {primary_alias}".strip())

    if artwork.get("year") is not None:
        queries.append(f"{author_name} {artwork['year']}".strip())

    deduped: list[str] = []
    seen = set()
    for query in queries:
        key = normalize_text(query)
        if key and key not in seen:
            deduped.append(query)
            seen.add(key)

    return deduped


def find_candidate(
    artwork: dict[str, Any],
    author_name: str,
) -> Candidate | None:
    if artwork["id"] in SKIP_IDS:
        return None

    if artwork["id"] in KNOWN_FILENAMES:
        known_file_title = KNOWN_FILENAMES[artwork["id"]]
        try:
            info = fetch_file_info(known_file_title)
        except urllib.error.URLError as error:
            print(
                f"  ! Wikimedia file lookup failed for '{known_file_title}': {error}",
                file=sys.stderr,
            )
        else:
            if info and info.get("url"):
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
                    score=999.0,
                    query_used="known-filename",
                )

    candidate_titles: list[tuple[str, str]] = []

    for query in build_queries(artwork, author_name):
        try:
            results = search_files(query)
        except urllib.error.URLError as error:
            print(f"  ! Wikimedia search failed for '{query}': {error}", file=sys.stderr)
            continue

        candidate_titles.extend((query, title) for title in results)

    best: Candidate | None = None
    seen_titles = set()

    for query_used, file_title in candidate_titles:
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

        score = candidate_score(artwork, author_name, info)
        if not is_good_match(artwork, author_name, info, score):
            continue

        candidate = Candidate(
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

        if best is None or candidate.score > best.score:
            best = candidate

    return best


def main() -> int:
    artworks = load_json(ARTWORKS_PATH)
    authors = {author["id"]: author["name"] for author in load_json(AUTHORS_PATH)}

    changed = False
    found_count = 0
    skipped_existing = 0
    missing: list[tuple[str, str]] = []
    processed = 0

    for artwork in artworks:
        artwork["image"] = normalize_image_field(artwork.get("image", {}))

        if artwork["image"]["source"] != "placeholder":
            skipped_existing += 1
            continue

        processed += 1
        author_name = authors.get(artwork["author_id"], "Autore sconosciuto")
        print(f"[{processed:02d}] {artwork['id']} — {artwork['title']} ({author_name})")

        try:
            candidate = find_candidate(artwork, author_name)
        except Exception as error:  # pragma: no cover - defensive for network-heavy script
            print(f"  ! Failed to process artwork: {error}", file=sys.stderr)
            missing.append((artwork["id"], artwork["title"]))
            continue

        if candidate is None:
            print("  → no reliable match found")
            missing.append((artwork["id"], artwork["title"]))
            continue

        artwork["image"] = {
            "source": "wikimedia",
            "url": candidate.url,
            "thumbnail": candidate.thumbnail,
            "license": candidate.license,
            "attribution": candidate.attribution,
        }
        found_count += 1
        changed = True
        save_artworks(artworks)
        print(
            "  ✓ "
            f"{candidate.file_title} | {candidate.width}x{candidate.height} | "
            f"{candidate.license} | score {candidate.score:.2f}"
        )

    if changed:
        save_artworks(artworks)

    total_missing = sum(1 for artwork in artworks if artwork["image"]["source"] == "placeholder")
    print()
    print("=" * 60)
    print("Wikimedia enrichment summary")
    print("=" * 60)
    print(f"Total artworks: {len(artworks)}")
    print(f"Processed placeholders: {processed}")
    print(f"Already populated before run: {skipped_existing}")
    print(f"Images found this run: {found_count}")
    print(f"Still missing: {total_missing}")

    if missing:
        print()
        print("Missing artworks:")
        for artwork_id, title in missing:
            print(f"- {artwork_id} | {title}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
