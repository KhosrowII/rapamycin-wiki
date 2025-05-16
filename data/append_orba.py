#!/usr/bin/env python
"""
append_orba.py
  1. read existing compounds.json
  2. read orba.tsv
  3. append new worm rows, tagging is_orba = True
"""

import csv, json, pathlib

BASE = pathlib.Path("data/compounds.json")
ORBA = pathlib.Path("orba.tsv")

rows = json.load(BASE.open())
next_id = max(r.get("id", 0) for r in rows) + 1

# FIX-ORBA-ROW-SHAPE ───────────────────────────────────────────
with ORBA.open(encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    for r in reader:
        delta_txt = r["% Change in Median Lifespan"].strip()
        try:
            delta_val = float(delta_txt)
        except ValueError:
            continue

        name = r["Treatment"].strip()
        rows.append({
            "id"        : next_id,
            "compound"  : name,
            # fields expected by the “signal” view
            "mean_delta": round(delta_val, 1),
            "best_delta": round(delta_val, 1),
            # minimal study list so the spark-line still renders
            "studies"   : [{
                "compound": name,
                "delta"   : delta_val,
                "model"   : "C. elegans",
                "pmid"    : "",              # Orba rarely has PMIDs
                "year"    : None,
            }],
            "n"         : 1,
            "model"     : "C. elegans",
            "dose"      : r["Dose"].strip(),
            "grade"     : "Very Low",        # worm only
            "class"     : "",                # filled later by MOA script
            "itp"       : "No",
            "is_orba"   : True
        })
        next_id += 1
# ──────────────────────────────────────────────────────────────


json.dump(rows, BASE.open("w", encoding="utf-8"), indent=2)
print(f"Total rows after Orba import: {len(rows)}")
