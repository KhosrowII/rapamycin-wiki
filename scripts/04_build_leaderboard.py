#!/usr/bin/env python
"""
Master script:
    1. run drugage_to_data.py    (your patched version)
    2. append_orba.py           (patched)
    3. parse newest PubMed rows (02_extract_delta output)
    4. for every new compound run get_moa()
"""

# FIX-IMPORTS -----------------------------------------------------------------
import json, csv, pathlib, subprocess
from fetch_moa import get_moa

DATA   = pathlib.Path("data/compounds.json")
PUBMED = pathlib.Path("data/pubmed_parsed.tsv")

# 1 + 2  – call your existing builders ----------------------
subprocess.run(["python", "drugage_to_data.py"], check=True)
subprocess.run(["python", "scripts/05_update_orba.py"], check=True)

rows = json.load(DATA.open())

# helper dict
by_name = {r["compound"].lower(): r for r in rows}

# 3  – ingest weekly PubMed extractions ----------------------
if PUBMED.exists():
    with PUBMED.open(encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for r in reader:
            name   = r["title"].split()[0].rstrip(",.;").capitalize()   # crude!
            delta  = float(r["delta"])
            model  = r["model"]
            pmid   = r["pmid"]

            rec = by_name.get(name.lower())
            if not rec:
                rec = {
                    "id": max(r.get("id", 0) for r in rows) + 1,
                    "compound": name,
                    "studies": [],
                    "n": 0,
                    "grade": "Very Low",
                    "class": "",
                    "model": model,
                    "itp": "",
                    "is_orba": False,
                }
                rows.append(rec)
                by_name[name.lower()] = rec

            rec["studies"].append({
                "compound": name,
                "delta": delta,
                "model": model,
                "pmid": pmid,
                "year": None,
            })
            rec["n"] += 1
            rec["mean_delta"] = round(
                sum(s["delta"] for s in rec["studies"]) / rec["n"], 1
            )
            rec["best_delta"] = round(
                max(abs(s["delta"]) for s in rec["studies"]), 1
            )

# 4  – MOA enrichment ---------------------------------------
for rec in rows:
    if not rec.get("class"):
        rec["class"] = get_moa(rec["compound"]) or ""

# write final JSON
rows.sort(key=lambda r: -(r.get("mean_delta") or 0))
json.dump(rows, DATA.open("w"), indent=2)
print("✅  leaderboard rebuilt → data/compounds.json")
