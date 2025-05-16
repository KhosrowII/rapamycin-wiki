#!/usr/bin/env python
"""
update_compounds.py
  • keeps your existing data/compounds.json
  • appends new PubMed hits parsed by 02_extract_delta.py
  • fills in missing MOA ('class') via fetch_moa.py and ai_moa.py
"""

import json
import csv
import pathlib
from scripts.fetch_moa import get_moa   # requires scripts/__init__.py
from scripts.ai_moa import ai_moa      # GPT-4o fallback for MOA

# Paths
data_path = pathlib.Path("data/compounds.json")
pubmed_tsv = pathlib.Path("data/pubmed_parsed.tsv")

# Load existing compounds
rows = json.load(data_path.open(encoding="utf-8"))
# Build lookup by compound name lowercase
by_name = {r["compound"].lower(): r for r in rows}
# Determine next available ID
next_id = max((r.get("id", 0) for r in rows), default=0) + 1

# 1 ── merge new PubMed rows (if any)
if pubmed_tsv.exists():
    with pubmed_tsv.open(encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for r in reader:
            name   = r["compound"]
            try:
                delta = float(r["delta"])
            except ValueError:
                continue
            model  = r["species"]
            pmid   = r["pmid"]
            try:
                year = int(r["year"])
            except (ValueError, TypeError):
                year = None

            # Lookup or create record
            rec = by_name.get(name.lower())
            if not rec:
                rec = {
                    "id": next_id,
                    "compound": name,
                    "studies": [],
                    "n": 0,
                    "mean_delta": 0,
                    "best_delta": 0,
                    "grade": "Very Low",
                    "class": "",
                    "model": model,
                    "itp": "",
                    "is_orba": False,
                }
                rows.append(rec)
                by_name[name.lower()] = rec
                next_id += 1

            # Append new study
            rec["studies"].append({
                "compound": name,
                "delta": delta,
                "model": model,
                "pmid": pmid,
                "year": year,
            })
            # Recalculate summary stats
            rec["n"] = len(rec["studies"])
            rec["mean_delta"] = round(
                sum(s["delta"] for s in rec["studies"]) / rec["n"], 1
            )
            rec["best_delta"] = round(
                max(abs(s["delta"]) for s in rec["studies"]), 1
            )

# 2 ── enrich missing MOA
for rec in rows:
    if not rec.get("class"):
        # Try ChEMBL first, then AI fallback
        rec["class"] = get_moa(rec["compound"]) or ai_moa(rec["compound"])

# 3 ── save back
rows.sort(key=lambda r: -(r.get("mean_delta") or 0))
json.dump(rows, data_path.open("w", encoding="utf-8"), indent=2)
print(f"✅  updated compounds.json – now {len(rows)} compounds")
