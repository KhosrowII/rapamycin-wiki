#!/usr/bin/env python
"""
update_years.py
  • Scans data/compounds.json for any study entries missing a `year`.
  • Fetches PubMed XML for each unique PMID via NCBI E-utilities.
  • Extracts the correct publication year using `smart_year`.
  • Caches all lookups in data/year_cache.json to avoid repeat fetches.
  • Patches `studies[].year` in-place and rewrites compounds.json.
"""

import json
import pathlib
import re
import time
import requests
import datetime

# ── Configuration ────────────────────────────────────────────────────────
DATA_PATH  = pathlib.Path("data/compounds.json")
CACHE_PATH = pathlib.Path("data/year_cache.json")

# ── Smart year extractor ───────────────────────────────────────────────────
YEAR_RE_PATTERNS = [
    re.compile(r"<PubDate>.*?(\d{4}).*?</PubDate>", re.S),
    re.compile(r"<PubMedPubDate[^>]+pubmed[^>]*>.*?(\d{4}).*?</PubMedPubDate>", re.S),
    re.compile(r"\nDP  - (\d{4})"),
]

def smart_year(xml_text: str) -> int | None:
    """
    Extract the earliest valid 4-digit year from:
      1) <PubDate> or <MedlineDate>
      2) PubMedPubDate[@PubStatus="pubmed"]
      3) 'DP  - YYYY' lines
    Returns None if no valid year found.
    """
    current = datetime.datetime.now().year
    for pattern in YEAR_RE_PATTERNS:
        m = pattern.search(xml_text)
        if m:
            yr = int(m.group(1))
            if 1900 <= yr <= current:
                return yr
    return None

# ── Load caches ───────────────────────────────────────────────────────────
if CACHE_PATH.exists():
    year_cache: dict[str, int] = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
else:
    year_cache = {}

# ── Load compounds.json ───────────────────────────────────────────────────
rows = json.loads(DATA_PATH.read_text(encoding="utf-8"))

# ── Collect missing-year PMIDs ─────────────────────────────────────────────
missing_pmids: set[str] = set()
for comp in rows:
    for study in comp.get("studies", []):
        pmid = str(study.get("pmid", "")).strip()
        if pmid and study.get("year") is None:
            missing_pmids.add(pmid)

print(f"🔎 Looking up years for {len(missing_pmids)} PMIDs...")

# ── Fetch and cache years ──────────────────────────────────────────────────
for count, pmid in enumerate(sorted(missing_pmids), start=1):
    if pmid in year_cache:
        continue
    url = (
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?"
        f"db=pubmed&id={pmid}&retmode=xml"
    )
    try:
        xml = requests.get(url, timeout=8).text
        yr = smart_year(xml)
        if yr:
            year_cache[pmid] = yr
            print(f"  {count}/{len(missing_pmids)}: PMID {pmid} → {yr}")
    except Exception as e:
        print(f"  ⚠ PMID {pmid} fetch failed: {e}")
    time.sleep(0.34)  # respect NCBI rate limit (~3 req/s)

# ── Write cache back ──────────────────────────────────────────────────────
CACHE_PATH.parent.mkdir(exist_ok=True)
CACHE_PATH.write_text(json.dumps(year_cache, indent=2), encoding="utf-8")
print(f"✅ Cached {len(year_cache)} years in {CACHE_PATH}")

# ── Patch compounds.json ──────────────────────────────────────────────────
updated = 0
for comp in rows:
    for study in comp.get("studies", []):
        pmid = str(study.get("pmid", "")).strip()
        if pmid and study.get("year") is None and pmid in year_cache:
            study["year"] = year_cache[pmid]
            updated += 1

DATA_PATH.write_text(json.dumps(rows, indent=2), encoding="utf-8")
print(f"✨ Filled {updated} missing years into {DATA_PATH}")
