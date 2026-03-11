#!/usr/bin/env python3
"""
ArtèItalia — Arricchimento metadati istituzioni.

Per le istituzioni con sito mancante, descrizione vuota o type "altro":
- prova a trovare una voce su Wikipedia in italiano;
- estrae la descrizione introduttiva;
- recupera il sito ufficiale da Wikidata (P856);
- in fallback, prova una ricerca web conservativa per il solo sito ufficiale;
- aggiorna il tipo con una regola basata sul nome.
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
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"
INSTITUTIONS_PATH = DATA_DIR / "institutions.json"
CITIES_PATH = DATA_DIR / "cities.json"

USER_AGENT = (
    "ArteeInstitutionEnricher/1.0 "
    "(https://github.com/davide-colombo/artee; contact: davide@example.com)"
)
WIKIPEDIA_API = "https://it.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
DUCKDUCKGO_HTML = "https://html.duckduckgo.com/html/"
REQUEST_DELAY_SECONDS = 1.0

last_request_at = 0.0
SSL_CONTEXT: ssl.SSLContext | None = None


def load_json(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


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


def http_get_json(url: str, params: dict[str, Any], *, throttled: bool = True) -> dict[str, Any]:
    if throttled:
        throttle()

    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(
        request,
        timeout=30,
        context=get_ssl_context(),
    ) as response:
        return json.load(response)


def http_get_text(url: str, params: dict[str, Any], *, throttled: bool = False) -> str:
    if throttled:
        throttle()

    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(
        request,
        timeout=30,
        context=get_ssl_context(),
    ) as response:
        return response.read().decode("utf-8", errors="replace")


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", " ", ascii_text)
    return re.sub(r"\s+", " ", ascii_text).strip()


def slugify(value: str) -> str:
    return normalize_text(value).replace(" ", "-")


def split_sentences(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    return [part.strip() for part in parts if part.strip()]


def canonicalize_url(url: str | None) -> str | None:
    if not url:
        return None

    parsed = urllib.parse.urlparse(url)
    if not parsed.scheme.startswith("http") or not parsed.netloc:
        return None

    cleaned = parsed._replace(query="", fragment="")
    return urllib.parse.urlunparse(cleaned).rstrip("/")


def first_sentences(text: str, minimum: int = 2, maximum: int = 3) -> str:
    sentences = split_sentences(text)
    if not sentences:
        return ""

    chosen = sentences[:maximum]
    if len(chosen) < minimum and len(sentences) >= minimum:
        chosen = sentences[:minimum]
    return " ".join(chosen).strip()


def clean_extract(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"\([^)]*coord[^)]*\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def guess_type(name: str, current_type: str) -> str:
    normalized = normalize_text(name)

    rules = [
        (("pinacoteca",), "pinacoteca"),
        (("galleria", "gallerie"), "galleria"),
        (("casa museo",), "casa_museo"),
        (("museo civico", "musei civici"), "museo_civico"),
        (("museo diocesano",), "museo_diocesano"),
        (("fondazione", "collezione"), "fondazione"),
        (
            ("palazzo", "castello", "basilica", "chiesa", "cappella", "duomo"),
            "complesso_monumentale",
        ),
    ]

    for needles, institution_type in rules:
        if any(needle in normalized for needle in needles):
            return institution_type

    return current_type if current_type and current_type != "altro" else "altro"


def significant_tokens(name: str) -> list[str]:
    stopwords = {
        "a",
        "agli",
        "alla",
        "alle",
        "all",
        "al",
        "arte",
        "cappella",
        "casa",
        "castello",
        "chiesa",
        "civici",
        "civico",
        "collezione",
        "complesso",
        "d",
        "da",
        "de",
        "dei",
        "del",
        "della",
        "delle",
        "di",
        "duomo",
        "e",
        "fondazione",
        "galleria",
        "gallerie",
        "gli",
        "il",
        "la",
        "le",
        "lo",
        "musei",
        "museo",
        "nazionale",
        "opera",
        "palazzo",
        "pinacoteca",
        "real",
        "reggio",
        "san",
        "santa",
    }
    return [
        token
        for token in normalize_text(name).split()
        if len(token) > 2 and token not in stopwords
    ]


def classify_place_keyword(name: str) -> str | None:
    normalized = normalize_text(name)
    keywords = [
        "pinacoteca",
        "galleria",
        "gallerie",
        "museo",
        "musei",
        "palazzo",
        "castello",
        "basilica",
        "chiesa",
        "cappella",
        "duomo",
        "casa",
        "collegio",
        "refettorio",
        "chiostro",
        "libreria",
        "cupola",
        "monastero",
        "pieve",
    ]
    for keyword in keywords:
        if keyword in normalized:
            return keyword
    return None


def score_candidate(
    institution_name: str,
    city_name: str,
    title: str,
    extract: str,
) -> float:
    name_tokens = significant_tokens(institution_name)
    city_tokens = significant_tokens(city_name)
    haystack = normalize_text(f"{title} {extract}")
    title_norm = normalize_text(title)
    institution_norm = normalize_text(institution_name)
    place_keyword = classify_place_keyword(institution_name)

    score = 0.0
    for token in name_tokens:
        if token in title_norm:
            score += 3.0
        elif token in haystack:
            score += 1.5

    for token in city_tokens:
        if token in haystack:
            score += 1.0

    if institution_norm and institution_norm in haystack:
        score += 2.0

    if title_norm == institution_norm:
        score += 4.0
    elif institution_norm and title_norm.startswith(institution_norm):
        score += 2.0

    if place_keyword and place_keyword not in title_norm:
        score -= 3.0

    return score


def wikipedia_search(institution_name: str, city_name: str) -> dict[str, Any] | None:
    query = f"{institution_name} {city_name}".strip()
    try:
        search_data = http_get_json(
            WIKIPEDIA_API,
            {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": 5,
                "srnamespace": 0,
                "format": "json",
            },
        )
    except (urllib.error.URLError, TimeoutError):
        return None

    search_results = search_data.get("query", {}).get("search", [])
    if not search_results:
        return None

    pageids = "|".join(str(result["pageid"]) for result in search_results)
    try:
        page_data = http_get_json(
            WIKIPEDIA_API,
            {
                "action": "query",
                "prop": "extracts|pageprops|info",
                "pageids": pageids,
                "exintro": 1,
                "explaintext": 1,
                "inprop": "url",
                "format": "json",
            },
        )
    except (urllib.error.URLError, TimeoutError):
        return None

    best: dict[str, Any] | None = None
    best_score = 0.0

    pages = page_data.get("query", {}).get("pages", {})
    for page in pages.values():
        extract = clean_extract(page.get("extract", ""))
        score = score_candidate(
            institution_name=institution_name,
            city_name=city_name,
            title=page.get("title", ""),
            extract=extract,
        )
        if score > best_score:
            best_score = score
            best = {
                "title": page.get("title"),
                "extract": extract,
                "page_url": page.get("fullurl"),
                "wikibase_item": page.get("pageprops", {}).get("wikibase_item"),
                "score": score,
            }

    if best_score < 4.0:
        return None

    return best


def wikidata_official_website(entity_id: str | None) -> str | None:
    if not entity_id:
        return None

    try:
        data = http_get_json(
            WIKIDATA_API,
            {
                "action": "wbgetentities",
                "ids": entity_id,
                "props": "claims",
                "format": "json",
            },
        )
    except (urllib.error.URLError, TimeoutError):
        return None

    entity = data.get("entities", {}).get(entity_id, {})
    claims = entity.get("claims", {}).get("P856", [])
    for claim in claims:
        datavalue = (
            claim.get("mainsnak", {})
            .get("datavalue", {})
            .get("value")
        )
        if isinstance(datavalue, str) and datavalue.startswith("http"):
            return canonicalize_url(datavalue)
    return None


def extract_ddg_results(html_text: str) -> list[dict[str, str]]:
    pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>',
        re.IGNORECASE | re.DOTALL,
    )
    results: list[dict[str, str]] = []
    for match in pattern.finditer(html_text):
        href = html.unescape(match.group("href"))
        title_html = match.group("title")
        title = re.sub(r"<[^>]+>", " ", title_html)
        title = re.sub(r"\s+", " ", html.unescape(title)).strip()
        if not href or not title:
            continue

        parsed = urllib.parse.urlparse(href)
        if "duckduckgo.com" in parsed.netloc:
            params = urllib.parse.parse_qs(parsed.query)
            redirected = params.get("uddg", [None])[0]
            if redirected:
                href = urllib.parse.unquote(redirected)

        results.append({"title": title, "url": href})
    return results


def direct_search_official_website(institution_name: str, city_name: str) -> str | None:
    query = f"{institution_name} {city_name} sito ufficiale"
    try:
        html_text = http_get_text(
            DUCKDUCKGO_HTML,
            {
                "q": query,
            },
        )
    except (urllib.error.URLError, TimeoutError):
        return None

    institution_norm = normalize_text(institution_name)
    city_tokens = significant_tokens(city_name)
    institution_tokens = significant_tokens(institution_name)

    for result in extract_ddg_results(html_text)[:8]:
        url = result["url"]
        title = result["title"]
        parsed = urllib.parse.urlparse(url)
        if not parsed.scheme.startswith("http"):
            continue

        domain = parsed.netloc.lower()
        title_norm = normalize_text(title)
        if institution_tokens:
            title_match = any(token in title_norm for token in institution_tokens)
        else:
            title_match = institution_norm in title_norm
        if not title_match:
            continue

        if city_tokens and not any(token in title_norm or token in domain for token in city_tokens):
            continue

        banned_domains = (
            "wikipedia.org",
            "wikidata.org",
            "commons.wikimedia.org",
            "google.com",
            "google.it",
            "googleartproject.com",
            "artsandculture.google.com",
            "tripadvisor.",
            "museionline.",
            "catalogo.beniculturali.",
        )
        if any(banned in domain for banned in banned_domains):
            continue

        allowed_suffixes = (".it", ".org", ".museum", ".eu", ".gallery")
        if not domain.endswith(allowed_suffixes) and ".gov." not in domain:
            continue

        title_confident = (
            "ufficiale" in title_norm
            or "official" in title_norm
            or "homepage" in title_norm
            or title_norm.startswith("home ")
        )
        if not title_confident:
            continue

        return canonicalize_url(
            f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        )

    return None


def needs_enrichment(institution: dict[str, Any]) -> bool:
    return (
        not institution.get("website")
        or not institution.get("description", "").strip()
        or institution.get("type") == "altro"
    )


def enrich_institution(
    institution: dict[str, Any],
    city_name: str,
) -> dict[str, Any]:
    updated = dict(institution)
    wiki = wikipedia_search(institution["name"], city_name)

    if not updated.get("description", "").strip() and wiki:
        description = first_sentences(wiki.get("extract", ""))
        if description:
            updated["description"] = description

    if not updated.get("website"):
        website = wikidata_official_website(wiki.get("wikibase_item") if wiki else None)
        if not website:
            website = direct_search_official_website(institution["name"], city_name)
        if website:
            updated["website"] = website

    guessed_type = guess_type(institution["name"], institution.get("type", "altro"))
    if institution.get("type") == "altro" and guessed_type != "altro":
        updated["type"] = guessed_type

    return updated


def main() -> int:
    institutions = load_json(INSTITUTIONS_PATH)
    cities = load_json(CITIES_PATH)
    city_names = {city["id"]: city["name"] for city in cities}

    updated_institutions: list[dict[str, Any]] = []
    updated_count = 0
    website_updates = 0
    description_updates = 0
    type_updates = 0

    for institution in institutions:
        if not needs_enrichment(institution):
            updated_institutions.append(institution)
            continue

        city_name = city_names.get(institution["city_id"], institution["city_id"])
        before = {
            "website": institution.get("website"),
            "description": institution.get("description", ""),
            "type": institution.get("type"),
        }
        enriched = enrich_institution(institution, city_name)

        if enriched.get("website") != before["website"]:
            website_updates += 1
        if (enriched.get("description", "").strip() != before["description"].strip()):
            description_updates += 1
        if enriched.get("type") != before["type"]:
            type_updates += 1
        if (
            enriched.get("website") != before["website"]
            or enriched.get("description", "").strip() != before["description"].strip()
            or enriched.get("type") != before["type"]
        ):
            updated_count += 1
            print(
                f"[updated] {institution['name']} "
                f"(web={'yes' if enriched.get('website') else 'no'}, "
                f"desc={'yes' if enriched.get('description', '').strip() else 'no'}, "
                f"type={enriched.get('type')})"
            )

        updated_institutions.append(enriched)

    save_json(INSTITUTIONS_PATH, updated_institutions)
    print()
    print(f"Istituzioni aggiornate: {updated_count}")
    print(f"Siti aggiornati: {website_updates}")
    print(f"Descrizioni aggiornate: {description_updates}")
    print(f"Tipi aggiornati: {type_updates}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrotto.", file=sys.stderr)
        raise SystemExit(130)
