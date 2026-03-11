#!/usr/bin/env python3
"""
ArtèItalia — Fetch immagini Wikimedia per le nuove opere dei grandi musei.

Riutilizza la logica di `fetch_images.py`, ma limita il processamento alle opere
aggiunte da `fill_major_museums.py`.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from fetch_images import find_candidate, load_json, normalize_image_field, save_artworks
from fill_major_museums import ARTWORKS_TO_ADD, artwork_slug

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"
ARTWORKS_PATH = DATA_DIR / "artworks.json"
AUTHORS_PATH = DATA_DIR / "authors.json"


def main() -> int:
    artworks = load_json(ARTWORKS_PATH)
    authors = {author["id"]: author["name"] for author in load_json(AUTHORS_PATH)}
    target_ids = {
        artwork_slug(item["title"], item["author_name"])
        for item in ARTWORKS_TO_ADD
    }

    changed = False
    found_count = 0
    processed = 0
    missing: list[tuple[str, str]] = []

    for artwork in artworks:
        if artwork["id"] not in target_ids:
            continue

        artwork["image"] = normalize_image_field(artwork.get("image", {}))
        if artwork["image"]["source"] != "placeholder":
            continue

        processed += 1
        author_name = authors.get(artwork["author_id"], "Autore sconosciuto")
        print(f"[{processed:02d}] {artwork['id']} — {artwork['title']} ({author_name})")

        try:
            candidate = find_candidate(artwork, author_name)
        except Exception as error:
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

    print()
    print("=" * 60)
    print("Major museum image enrichment summary")
    print("=" * 60)
    print(f"Target artworks: {len(target_ids)}")
    print(f"Processed placeholders: {processed}")
    print(f"Images found this run: {found_count}")
    print(f"Still missing among targets: {processed - found_count}")

    if missing:
        print()
        print("Missing target artworks:")
        for artwork_id, title in missing:
            print(f"- {artwork_id} | {title}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
