#!/usr/bin/env python3
"""
ArtèItalia — Script di validazione integrità dati
Verifica integrità referenziale, unicità ID, campi obbligatori.
"""

from collections import Counter
import json
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"

def load(name: str) -> list[dict]:
    path = DATA_DIR / f"{name}.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def validate():
    errors = []
    warnings = []

    # Caricamento
    regions = load("regions")
    cities = load("cities")
    institutions = load("institutions")
    authors = load("authors")
    movements = load("movements")
    periods = load("periods")
    artworks = load("artworks")

    # Indici ID
    region_ids = {r["id"] for r in regions}
    city_ids = {c["id"] for c in cities}
    institution_ids = {i["id"] for i in institutions}
    author_ids = {a["id"] for a in authors}
    movement_ids = {m["id"] for m in movements}
    period_ids = {p["id"] for p in periods}
    artwork_ids = {a["id"] for a in artworks}

    # 1. Unicità ID
    for name, data in [
        ("regions", regions), ("cities", cities), ("institutions", institutions),
        ("authors", authors), ("movements", movements), ("periods", periods),
        ("artworks", artworks)
    ]:
        ids = [d["id"] for d in data]
        dupes = [id_ for id_, count in Counter(ids).items() if count > 1]
        if dupes:
            errors.append(f"[{name}] ID duplicati: {dupes}")

    # 2. Referenziale: cities -> regions
    for c in cities:
        if c["region_id"] not in region_ids:
            errors.append(f"[cities] '{c['id']}' -> region_id '{c['region_id']}' inesistente")

    # 3. Referenziale: institutions -> cities, periods, movements
    for i in institutions:
        if i["city_id"] not in city_ids:
            errors.append(f"[institutions] '{i['id']}' -> city_id '{i['city_id']}' inesistente")
        for p in i.get("periods", []):
            if p not in period_ids:
                errors.append(f"[institutions] '{i['id']}' -> period '{p}' inesistente")
        for m in i.get("movements", []):
            if m not in movement_ids:
                errors.append(f"[institutions] '{i['id']}' -> movement '{m}' inesistente")

    # 4. Referenziale: authors -> movements
    for a in authors:
        for m in a.get("movements", []):
            if m not in movement_ids:
                errors.append(f"[authors] '{a['id']}' -> movement '{m}' inesistente")

    # 5. Referenziale: movements -> periods
    for m in movements:
        if m["period_id"] not in period_ids:
            errors.append(f"[movements] '{m['id']}' -> period_id '{m['period_id']}' inesistente")

    # 6. Referenziale: artworks -> authors, institutions, periods, movements
    for aw in artworks:
        if aw["author_id"] not in author_ids:
            errors.append(f"[artworks] '{aw['id']}' -> author_id '{aw['author_id']}' inesistente")
        if aw["institution_id"] not in institution_ids:
            errors.append(f"[artworks] '{aw['id']}' -> institution_id '{aw['institution_id']}' inesistente")
        if aw["period_id"] not in period_ids:
            errors.append(f"[artworks] '{aw['id']}' -> period_id '{aw['period_id']}' inesistente")
        if aw["movement_id"] not in movement_ids:
            errors.append(f"[artworks] '{aw['id']}' -> movement_id '{aw['movement_id']}' inesistente")

    # 7. Campi obbligatori artworks
    for aw in artworks:
        if not aw.get("title"):
            errors.append(f"[artworks] '{aw['id']}' -> title mancante")
        if aw.get("year") is None and aw.get("year_range") is None:
            warnings.append(f"[artworks] '{aw['id']}' -> né year né year_range specificato")
        image = aw.get("image", {})
        for required_field in ["source", "url", "thumbnail", "license", "attribution"]:
            if required_field not in image:
                errors.append(
                    f"[artworks] '{aw['id']}' -> image.{required_field} mancante"
                )

    # 8. Artworks senza immagine
    no_image = [aw["id"] for aw in artworks if aw["image"]["source"] == "placeholder"]
    
    # 9. Opere non verificate
    unverified = [aw["id"] for aw in artworks if not aw["verified"]]

    # Report
    print("=" * 60)
    print("ArtèItalia — Report di validazione")
    print("=" * 60)
    print()
    print(f"Regioni:     {len(regions)}")
    print(f"Città:       {len(cities)}")
    print(f"Istituzioni: {len(institutions)}")
    print(f"Autori:      {len(authors)}")
    print(f"Correnti:    {len(movements)}")
    print(f"Periodi:     {len(periods)}")
    print(f"Opere:       {len(artworks)}")
    print()

    if errors:
        print(f"ERRORI ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
        print()
    else:
        print("ERRORI: nessuno ✓")
        print()

    if warnings:
        print(f"AVVISI ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠ {w}")
        print()

    print(f"Immagini placeholder: {len(no_image)}/{len(artworks)}")
    print(f"Opere non verificate: {len(unverified)}/{len(artworks)}")
    if unverified:
        for u in unverified:
            print(f"  → {u}")
    print()

    # Copertura per regione
    print("Copertura per regione:")
    inst_by_region = {}
    for i in institutions:
        city = next((c for c in cities if c["id"] == i["city_id"]), None)
        if city:
            r = city["region_id"]
            inst_by_region.setdefault(r, []).append(i["id"])
    
    art_by_region = {}
    for aw in artworks:
        inst = next((i for i in institutions if i["id"] == aw["institution_id"]), None)
        if inst:
            city = next((c for c in cities if c["id"] == inst["city_id"]), None)
            if city:
                r = city["region_id"]
                art_by_region.setdefault(r, []).append(aw["id"])

    for r in sorted(region_ids):
        n_inst = len(inst_by_region.get(r, []))
        n_art = len(art_by_region.get(r, []))
        name = next((reg["name"] for reg in regions if reg["id"] == r), r)
        marker = "  " if n_inst > 0 else "  ⚠ "
        print(f"{marker}{name}: {n_inst} istituzioni, {n_art} opere")

    print()
    print("=" * 60)

    return len(errors) == 0

if __name__ == "__main__":
    ok = validate()
    sys.exit(0 if ok else 1)
