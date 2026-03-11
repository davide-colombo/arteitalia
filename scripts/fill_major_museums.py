#!/usr/bin/env python3
"""
ArtèItalia — Riempimento mirato dei grandi musei.

Aggiunge opere mancanti ai musei target, evitando duplicati sullo slug
`title + cognome autore`, e crea solo le entità strettamente necessarie.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from parse_research import guess_movement, slugify, year_to_period

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"
ARTWORKS_PATH = DATA_DIR / "artworks.json"
AUTHORS_PATH = DATA_DIR / "authors.json"
INSTITUTIONS_PATH = DATA_DIR / "institutions.json"
MOVEMENTS_PATH = DATA_DIR / "movements.json"

NEW_INSTITUTIONS = [
    {
        "id": "musei-vaticani",
        "name": "Musei Vaticani",
        "type": "altro",
        "city_id": "roma",
        "description": (
            "Complesso museale della Città del Vaticano, centrale per la storia "
            "dell’arte italiana e universale. Comprende la Cappella Sistina, le "
            "Stanze di Raffaello e la Pinacoteca Vaticana."
        ),
        "website": "https://www.museivaticani.va/",
        "periods": ["quattrocento", "cinquecento", "seicento"],
        "movements": ["rinascimento", "rinascimento-maturo", "barocco"],
        "notes": (
            "Istituzione della Città del Vaticano inclusa nel catalogo per la sua "
            "rilevanza nella storia dell’arte italiana."
        ),
    },
    {
        "id": "palazzo-ducale-venezia",
        "name": "Palazzo Ducale",
        "type": "complesso_monumentale",
        "city_id": "venezia",
        "description": (
            "Sede storica del potere veneziano, conserva cicli decorativi e grandi "
            "tele di Veronese, Tintoretto e Tiepolo. È uno dei complessi monumentali "
            "più rappresentativi della pittura di stato della Serenissima."
        ),
        "website": "https://palazzoducale.visitmuve.it/",
        "periods": ["cinquecento", "settecento"],
        "movements": ["rinascimento-maturo", "barocco"],
        "notes": "Istituzione distinta dal Palazzo Ducale di Mantova già presente nel dataset.",
    },
]

AUTHOR_METADATA = {
    "bernardino-luini": {
        "name": "Bernardino Luini",
        "birth_year": 1480,
        "death_year": 1532,
        "bio": (
            "Pittore lombardo vicino alla cerchia leonardesca, tra i protagonisti "
            "del Rinascimento milanese."
        ),
        "movements": ["rinascimento-maturo"],
    },
    "salai": {
        "name": "Salaì",
        "birth_year": 1480,
        "death_year": 1524,
        "bio": (
            "Allievo e collaboratore di Leonardo da Vinci, attivo tra Milano e la "
            "Lombardia nei primi decenni del Cinquecento."
        ),
        "movements": ["rinascimento-maturo"],
    },
    "giovanni-ambrogio-de-predis": {
        "name": "Giovanni Ambrogio de Predis",
        "birth_year": 1455,
        "death_year": 1508,
        "bio": (
            "Pittore lombardo attivo alla corte sforzesca, vicino al linguaggio "
            "di Leonardo e della ritrattistica milanese."
        ),
        "movements": ["rinascimento"],
    },
    "giusto-di-gand": {
        "name": "Giusto di Gand",
        "birth_year": 1430,
        "death_year": 1480,
        "bio": (
            "Pittore fiammingo attivo a Urbino presso la corte di Federico da "
            "Montefeltro, noto anche come Joos van Wassenhove."
        ),
        "movements": ["rinascimento"],
    },
    "giovanni-di-paolo": {
        "name": "Giovanni di Paolo",
        "birth_year": 1403,
        "death_year": 1482,
        "bio": (
            "Pittore senese del Quattrocento, celebre per l’invenzione fantastica "
            "e la spiritualità visionaria delle sue tavole."
        ),
        "movements": ["rinascimento"],
    },
    "domenico-di-bartolo": {
        "name": "Domenico di Bartolo",
        "birth_year": 1400,
        "death_year": 1445,
        "bio": (
            "Pittore senese del primo Rinascimento, legato ai cantieri dello "
            "Spedale di Santa Maria della Scala."
        ),
        "movements": ["rinascimento"],
    },
    "beccafumi": {
        "name": "Domenico Beccafumi",
        "birth_year": 1486,
        "death_year": 1551,
        "bio": (
            "Pittore senese del pieno Cinquecento, tra i maggiori interpreti del "
            "manierismo toscano."
        ),
        "movements": ["manierismo"],
    },
    "hans-holbein-il-giovane": {
        "name": "Hans Holbein il Giovane",
        "birth_year": 1497,
        "death_year": 1543,
        "bio": (
            "Pittore e ritrattista tedesco del Rinascimento, celebre per i dipinti "
            "realizzati alla corte di Enrico VIII."
        ),
        "movements": ["rinascimento-maturo"],
    },
}

ARTWORKS_TO_ADD = [
    # Galleria Borghese
    {
        "institution_id": "galleria-borghese",
        "title": "Ragazzo con canestro di frutta",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": 1593,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "Madonna dei Palafrenieri",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": None,
        "year_approximate": False,
        "year_range": [1605, 1606],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "San Giovanni Battista",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": 1610,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "Davide con la testa di Golia",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": None,
        "year_approximate": False,
        "year_range": [1609, 1610],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "Dama con liocorno",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": 1505,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "Deposizione Borghese",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": 1507,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "Danae",
        "author_id": "correggio",
        "author_name": "Correggio",
        "year": None,
        "year_approximate": False,
        "year_range": [1531, 1532],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-borghese",
        "title": "Madonna col Bambino tra i santi Flaviano e Onofrio",
        "author_id": "lorenzo-lotto",
        "author_name": "Lorenzo Lotto",
        "year": 1508,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    # Pinacoteca di Brera
    {
        "institution_id": "pinacoteca-di-brera",
        "title": "Cristo morto nel sepolcro e tre dolenti",
        "author_id": "andrea-mantegna",
        "author_name": "Andrea Mantegna",
        "year": 1483,
        "year_approximate": True,
        "year_range": None,
        "medium": "Tempera su tela",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-di-brera",
        "title": "Cena in Emmaus",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": 1606,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-di-brera",
        "title": "Pietà",
        "author_id": "giovanni-bellini",
        "author_name": "Giovanni Bellini",
        "year": None,
        "year_approximate": False,
        "year_range": [1465, 1470],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-di-brera",
        "title": "Il ritrovamento del corpo di san Marco",
        "author_id": "tintoretto",
        "author_name": "Tintoretto",
        "year": None,
        "year_approximate": False,
        "year_range": [1562, 1566],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    # Musei Vaticani
    {
        "institution_id": "musei-vaticani",
        "title": "Giudizio Universale",
        "author_id": "michelangelo-buonarroti",
        "author_name": "Michelangelo Buonarroti",
        "year": None,
        "year_approximate": False,
        "year_range": [1536, 1541],
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Creazione di Adamo",
        "author_id": "michelangelo-buonarroti",
        "author_name": "Michelangelo Buonarroti",
        "year": 1511,
        "year_approximate": True,
        "year_range": None,
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Separazione della luce dalle tenebre",
        "author_id": "michelangelo-buonarroti",
        "author_name": "Michelangelo Buonarroti",
        "year": 1512,
        "year_approximate": False,
        "year_range": None,
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Sibilla Delfica",
        "author_id": "michelangelo-buonarroti",
        "author_name": "Michelangelo Buonarroti",
        "year": 1509,
        "year_approximate": True,
        "year_range": None,
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Profeta Isaia",
        "author_id": "michelangelo-buonarroti",
        "author_name": "Michelangelo Buonarroti",
        "year": 1511,
        "year_approximate": True,
        "year_range": None,
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Scuola di Atene",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1509, 1511],
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Disputa del Sacramento",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1509, 1510],
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Parnaso",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1510, 1511],
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Liberazione di san Pietro",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1513, 1514],
        "medium": "Affresco",
        "dimensions": None,
    },
    {
        "institution_id": "musei-vaticani",
        "title": "Trasfigurazione",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1518, 1520],
        "medium": "Olio su tavola, trasportato su tela",
        "dimensions": None,
    },
    # Galleria Palatina
    {
        "institution_id": "galleria-palatina",
        "title": "La Velata",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1515, 1516],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-palatina",
        "title": "Madonna della Seggiola",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1513, 1514],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-palatina",
        "title": "La Gravida",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": 1506,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-palatina",
        "title": "Madonna dell'Impannata",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1513, 1514],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-palatina",
        "title": "Santa Maria Maddalena",
        "author_id": "tiziano-vecellio",
        "author_name": "Tiziano Vecellio",
        "year": None,
        "year_approximate": False,
        "year_range": [1531, 1533],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    # Capodimonte
    {
        "institution_id": "museo-e-real-bosco-di-capodimonte",
        "title": "La Flagellazione di Cristo",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": 1607,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "museo-e-real-bosco-di-capodimonte",
        "title": "Danae",
        "author_id": "tiziano-vecellio",
        "author_name": "Tiziano Vecellio",
        "year": None,
        "year_approximate": False,
        "year_range": [1544, 1546],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "museo-e-real-bosco-di-capodimonte",
        "title": "Ritratto di papa Paolo III con i nipoti Alessandro e Ottavio Farnese",
        "author_id": "tiziano-vecellio",
        "author_name": "Tiziano Vecellio",
        "year": 1546,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "museo-e-real-bosco-di-capodimonte",
        "title": "Ercole al bivio",
        "author_id": "annibale-carracci",
        "author_name": "Annibale Carracci",
        "year": None,
        "year_approximate": False,
        "year_range": [1596, 1597],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    # Galleria Nazionale dell'Umbria
    {
        "institution_id": "galleria-nazionale-dellumbria",
        "title": "Polittico Guidalotti",
        "author_id": "beato-angelico",
        "author_name": "Beato Angelico",
        "year": None,
        "year_approximate": False,
        "year_range": [1447, 1449],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-nazionale-dellumbria",
        "title": "Polittico di Sant'Antonio",
        "author_id": "piero-della-francesca",
        "author_name": "Piero della Francesca",
        "year": None,
        "year_approximate": False,
        "year_range": [1460, 1470],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-nazionale-dellumbria",
        "title": "Adorazione dei Magi",
        "author_id": "pietro-perugino",
        "author_name": "Pietro Perugino",
        "year": None,
        "year_approximate": False,
        "year_range": [1475, 1476],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    # Galleria Nazionale delle Marche
    {
        "institution_id": "galleria-nazionale-delle-marche",
        "title": "La Muta",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": 1507,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-nazionale-delle-marche",
        "title": "Madonna di Senigallia",
        "author_id": "piero-della-francesca",
        "author_name": "Piero della Francesca",
        "year": 1474,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio e tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-nazionale-delle-marche",
        "title": "Resurrezione di Cristo",
        "author_id": "tiziano-vecellio",
        "author_name": "Tiziano Vecellio",
        "year": None,
        "year_approximate": False,
        "year_range": [1543, 1544],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "galleria-nazionale-delle-marche",
        "title": "Comunione degli Apostoli",
        "author_id": "giusto-di-gand",
        "author_name": "Giusto di Gand",
        "year": None,
        "year_approximate": False,
        "year_range": [1473, 1474],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    # Pinacoteca Nazionale di Siena
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "Madonna dei Francescani",
        "author_id": "duccio-di-buoninsegna",
        "author_name": "Duccio di Buoninsegna",
        "year": 1290,
        "year_approximate": True,
        "year_range": None,
        "medium": "Tempera e oro su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "Madonna dell'Umiltà",
        "author_id": "domenico-di-bartolo",
        "author_name": "Domenico di Bartolo",
        "year": 1433,
        "year_approximate": True,
        "year_range": None,
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "Giudizio Universale",
        "author_id": "giovanni-di-paolo",
        "author_name": "Giovanni di Paolo",
        "year": None,
        "year_approximate": False,
        "year_range": [1460, 1465],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "Assunzione della Vergine",
        "author_id": "giovanni-di-paolo",
        "author_name": "Giovanni di Paolo",
        "year": 1455,
        "year_approximate": True,
        "year_range": None,
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "San Michele Arcangelo che scaccia gli angeli ribelli",
        "author_id": "beccafumi",
        "author_name": "Domenico Beccafumi",
        "year": None,
        "year_approximate": False,
        "year_range": [1524, 1526],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "Nascita della Vergine",
        "author_id": "beccafumi",
        "author_name": "Domenico Beccafumi",
        "year": None,
        "year_approximate": False,
        "year_range": [1540, 1543],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-nazionale-di-siena",
        "title": "Incoronazione della Vergine",
        "author_id": "beccafumi",
        "author_name": "Domenico Beccafumi",
        "year": 1545,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    # Palazzo Ducale Venezia
    {
        "institution_id": "palazzo-ducale-venezia",
        "title": "Apoteosi di Venezia",
        "author_id": "paolo-veronese",
        "author_name": "Paolo Veronese",
        "year": 1585,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-ducale-venezia",
        "title": "Giunone offre a Venezia il corno dogale, il serto e le ricchezze",
        "author_id": "paolo-veronese",
        "author_name": "Paolo Veronese",
        "year": None,
        "year_approximate": False,
        "year_range": [1553, 1554],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-ducale-venezia",
        "title": "Ratto d'Europa",
        "author_id": "paolo-veronese",
        "author_name": "Paolo Veronese",
        "year": 1580,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-ducale-venezia",
        "title": "Nozze di Bacco e Arianna",
        "author_id": "tintoretto",
        "author_name": "Tintoretto",
        "year": 1578,
        "year_approximate": False,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-ducale-venezia",
        "title": "Nettuno offre a Venezia le ricchezze del mare",
        "author_id": "giambattista-tiepolo",
        "author_name": "Giambattista Tiepolo",
        "year": None,
        "year_approximate": False,
        "year_range": [1748, 1750],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    # Museo di Castelvecchio
    {
        "institution_id": "museo-di-castelvecchio",
        "title": "Sacra Famiglia con una santa",
        "author_id": "andrea-mantegna",
        "author_name": "Andrea Mantegna",
        "year": None,
        "year_approximate": False,
        "year_range": [1495, 1505],
        "medium": "Tempera su tela",
        "dimensions": "76 x 55,5 cm",
        "notes": "Attribuzione tradizionale ad Andrea Mantegna.",
    },
    {
        "institution_id": "museo-di-castelvecchio",
        "title": "Madonna allattante",
        "author_id": "tintoretto",
        "author_name": "Tintoretto",
        "year": 1575,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "museo-di-castelvecchio",
        "title": "Trasporto dell'Arca dell'Alleanza",
        "author_id": "tintoretto",
        "author_name": "Tintoretto",
        "year": 1577,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "museo-di-castelvecchio",
        "title": "Banchetto di Baldassarre",
        "author_id": "tintoretto",
        "author_name": "Tintoretto",
        "year": 1545,
        "year_approximate": True,
        "year_range": None,
        "medium": "Olio su tela",
        "dimensions": None,
    },
    # Pinacoteca Ambrosiana
    {
        "institution_id": "pinacoteca-ambrosiana",
        "title": "Cartone preparatorio per la Scuola di Atene",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1508, 1510],
        "medium": "Carboncino, biacca e punta metallica su carta",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-ambrosiana",
        "title": "Madonna col Bambino (Madonna del Padiglione)",
        "author_id": "sandro-botticelli",
        "author_name": "Sandro Botticelli",
        "year": None,
        "year_approximate": False,
        "year_range": [1493, 1494],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-ambrosiana",
        "title": "Sacra Famiglia con sant'Anna e san Giovanni Battista",
        "author_id": "bernardino-luini",
        "author_name": "Bernardino Luini",
        "year": None,
        "year_approximate": False,
        "year_range": [1525, 1530],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-ambrosiana",
        "title": "San Giovanni Battista",
        "author_id": "salai",
        "author_name": "Salaì",
        "year": None,
        "year_approximate": False,
        "year_range": [1510, 1520],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-ambrosiana",
        "title": "Adorazione dei Magi",
        "author_id": "tiziano-vecellio",
        "author_name": "Tiziano Vecellio",
        "year": None,
        "year_approximate": False,
        "year_range": [1540, 1545],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "pinacoteca-ambrosiana",
        "title": "Ritratto di dama",
        "author_id": "giovanni-ambrogio-de-predis",
        "author_name": "Giovanni Ambrogio de Predis",
        "year": None,
        "year_approximate": False,
        "year_range": [1490, 1495],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    # Palazzo Barberini
    {
        "institution_id": "palazzo-barberini",
        "title": "Annunciazione",
        "author_id": "filippo-lippi",
        "author_name": "Filippo Lippi",
        "year": None,
        "year_approximate": False,
        "year_range": [1440, 1445],
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-barberini",
        "title": "Madonna di Tarquinia",
        "author_id": "filippo-lippi",
        "author_name": "Filippo Lippi",
        "year": 1437,
        "year_approximate": False,
        "year_range": None,
        "medium": "Tempera su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-barberini",
        "title": "La Fornarina",
        "author_id": "raffaello-sanzio",
        "author_name": "Raffaello Sanzio",
        "year": None,
        "year_approximate": False,
        "year_range": [1518, 1519],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-barberini",
        "title": "Giuditta e Oloferne",
        "author_id": "caravaggio",
        "author_name": "Caravaggio",
        "year": None,
        "year_approximate": False,
        "year_range": [1598, 1599],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-barberini",
        "title": "Battesimo di Cristo",
        "author_id": "el-greco",
        "author_name": "El Greco",
        "year": None,
        "year_approximate": False,
        "year_range": [1567, 1570],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-barberini",
        "title": "Adorazione dei pastori",
        "author_id": "el-greco",
        "author_name": "El Greco",
        "year": None,
        "year_approximate": False,
        "year_range": [1570, 1572],
        "medium": "Olio su tela",
        "dimensions": None,
    },
    {
        "institution_id": "palazzo-barberini",
        "title": "Ritratto di Enrico VIII",
        "author_id": "hans-holbein-il-giovane",
        "author_name": "Hans Holbein il Giovane",
        "year": None,
        "year_approximate": False,
        "year_range": [1540, 1542],
        "medium": "Olio su tavola",
        "dimensions": None,
    },
]

REPORT_GROUPS = {
    "Gallerie degli Uffizi": {
        "institution_ids": ["gallerie-degli-uffizi"],
        "target_min": 25,
    },
    "Galleria Borghese": {
        "institution_ids": ["galleria-borghese"],
        "target_min": 15,
    },
    "Pinacoteca di Brera": {
        "institution_ids": ["pinacoteca-brera", "pinacoteca-di-brera"],
        "target_min": 15,
    },
    "Musei Vaticani / Cappella Sistina": {
        "institution_ids": ["musei-vaticani"],
        "target_min": 10,
    },
    "Gallerie dell’Accademia": {
        "institution_ids": ["gallerie-dellaccademia"],
        "target_min": 15,
    },
    "Galleria Palatina": {
        "institution_ids": ["galleria-palatina"],
        "target_min": 10,
    },
    "Museo e Real Bosco di Capodimonte": {
        "institution_ids": ["museo-e-real-bosco-di-capodimonte"],
        "target_min": 10,
    },
    "Galleria Nazionale dell’Umbria": {
        "institution_ids": ["galleria-nazionale-dellumbria"],
        "target_min": 8,
    },
    "Galleria Nazionale delle Marche": {
        "institution_ids": ["galleria-nazionale-delle-marche"],
        "target_min": 5,
    },
    "Pinacoteca Nazionale di Siena": {
        "institution_ids": ["pinacoteca-nazionale-di-siena"],
        "target_min": 8,
    },
    "Palazzo Ducale (Venezia)": {
        "institution_ids": ["palazzo-ducale-venezia"],
        "target_min": 5,
    },
    "Museo di Castelvecchio": {
        "institution_ids": ["museo-di-castelvecchio"],
        "target_min": 5,
    },
    "Pinacoteca Ambrosiana": {
        "institution_ids": ["pinacoteca-ambrosiana"],
        "target_min": 8,
    },
    "Palazzo Barberini": {
        "institution_ids": ["palazzo-barberini"],
        "target_min": 8,
    },
}


def load_json(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def institution_count(artworks: list[dict[str, Any]], institution_ids: list[str]) -> int:
    ids = set(institution_ids)
    return sum(1 for artwork in artworks if artwork["institution_id"] in ids)


def build_report(artworks: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    return {
        name: {
            "count": institution_count(artworks, config["institution_ids"]),
            "target_min": config["target_min"],
        }
        for name, config in REPORT_GROUPS.items()
    }


def ensure_institutions(institutions: list[dict[str, Any]]) -> int:
    by_id = {institution["id"]: institution for institution in institutions}
    added = 0
    for institution in NEW_INSTITUTIONS:
        if institution["id"] in by_id:
            continue
        institutions.append(institution)
        added += 1
    return added


def ensure_authors(
    authors: list[dict[str, Any]],
    movements: set[str],
    artworks_to_add: list[dict[str, Any]],
) -> int:
    by_id = {author["id"]: author for author in authors}
    added = 0

    for artwork in artworks_to_add:
        author_id = artwork["author_id"]
        if author_id in by_id:
            continue

        metadata = AUTHOR_METADATA.get(author_id)
        if not metadata:
            inferred_period = year_to_period(artwork["year"], artwork["year_range"])
            inferred_movement = guess_movement(artwork["author_name"], inferred_period)
            movement_list = [inferred_movement] if inferred_movement in movements else ["rinascimento"]
            metadata = {
                "name": artwork["author_name"],
                "birth_year": None,
                "death_year": None,
                "bio": "",
                "movements": movement_list,
            }

        authors.append(
            {
                "id": author_id,
                **metadata,
            }
        )
        by_id[author_id] = authors[-1]
        added += 1

    return added


def pick_movement(
    author: dict[str, Any] | None,
    author_name: str,
    year: int | None,
    year_range: list[int] | None,
    movement_ids: set[str],
) -> tuple[str, str]:
    period_id = year_to_period(year, year_range)

    if author and author.get("movements"):
        movement_id = author["movements"][0]
        if movement_id in movement_ids:
            return period_id, movement_id

    guessed = guess_movement(author_name, period_id)
    if guessed in movement_ids:
        return period_id, guessed

    fallback = {
        "medioevo": "gotico",
        "quattrocento": "rinascimento",
        "cinquecento": "rinascimento-maturo",
        "seicento": "barocco",
        "settecento": "barocco",
        "ottocento": "romanticismo",
        "novecento": "novecento-italiano",
        "contemporaneo": "arte-contemporanea",
    }
    movement_id = fallback.get(period_id, "rinascimento")
    if movement_id not in movement_ids:
        movement_id = "rinascimento"
    return period_id, movement_id


def artwork_slug(title: str, author_name: str) -> str:
    author_surname = author_name.split()[-1]
    return slugify(f"{title}-{author_surname}")


def main() -> int:
    artworks = load_json(ARTWORKS_PATH)
    authors = load_json(AUTHORS_PATH)
    institutions = load_json(INSTITUTIONS_PATH)
    movement_ids = {movement["id"] for movement in load_json(MOVEMENTS_PATH)}

    before_report = build_report(artworks)
    existing_artwork_ids = {artwork["id"] for artwork in artworks}
    author_index = {author["id"]: author for author in authors}

    institutions_added = ensure_institutions(institutions)
    authors_added = ensure_authors(authors, movement_ids, ARTWORKS_TO_ADD)
    author_index = {author["id"]: author for author in authors}

    added_by_museum = {name: 0 for name in REPORT_GROUPS}
    artworks_added = 0
    artworks_skipped = 0

    museum_name_by_institution_id: dict[str, str] = {}
    for museum_name, config in REPORT_GROUPS.items():
        for institution_id in config["institution_ids"]:
            museum_name_by_institution_id[institution_id] = museum_name

    for item in ARTWORKS_TO_ADD:
        new_id = artwork_slug(item["title"], item["author_name"])
        if new_id in existing_artwork_ids:
            artworks_skipped += 1
            continue

        author = author_index.get(item["author_id"])
        period_id, movement_id = pick_movement(
            author=author,
            author_name=item["author_name"],
            year=item["year"],
            year_range=item["year_range"],
            movement_ids=movement_ids,
        )

        artwork = {
            "id": new_id,
            "title": item["title"],
            "author_id": item["author_id"],
            "year": item["year"],
            "year_approximate": item.get("year_approximate", False),
            "year_range": item["year_range"],
            "period_id": period_id,
            "movement_id": movement_id,
            "institution_id": item["institution_id"],
            "medium": item.get("medium"),
            "dimensions": item.get("dimensions"),
            "description": "",
            "image": {
                "source": "placeholder",
                "url": None,
                "thumbnail": None,
                "license": None,
                "attribution": None,
            },
            "links": item.get("links", []),
            "verified": False,
            "notes": item.get("notes"),
        }
        artworks.append(artwork)
        existing_artwork_ids.add(new_id)
        artworks_added += 1

        museum_name = museum_name_by_institution_id.get(item["institution_id"])
        if museum_name:
            added_by_museum[museum_name] += 1

    save_json(ARTWORKS_PATH, artworks)
    save_json(AUTHORS_PATH, authors)
    save_json(INSTITUTIONS_PATH, institutions)

    after_report = build_report(artworks)

    print(f"Istituzioni nuove: {institutions_added}")
    print(f"Autori nuovi: {authors_added}")
    print(f"Opere aggiunte: {artworks_added}")
    print(f"Opere saltate per duplicato: {artworks_skipped}")
    print()
    print("Report musei:")
    for museum_name in REPORT_GROUPS:
        before = before_report[museum_name]["count"]
        after = after_report[museum_name]["count"]
        target = after_report[museum_name]["target_min"]
        added = added_by_museum.get(museum_name, 0)
        print(
            f"- {museum_name}: +{added}, totale {after} "
            f"(prima {before}, target minimo {target})"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
