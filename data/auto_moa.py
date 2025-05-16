#!/usr/bin/env python
"""
auto_moa.py  — enrich compounds.json with MOA pulled from ChEMBL
Only updates rows whose class is still 'Unclassified'.
"""

import json, re, httpx, pathlib, time

JSON_PATH = pathlib.Path("data/compounds.json")

with JSON_PATH.open() as f:
    compounds = json.load(f)

# Simple keyword → class map based on ChEMBL's mechanism summary
MOA_KEYWORDS = {
    r"MTOR":            "mTOR inhibitor",
    r"AMPK":            "AMPK activator",
    r"GLUCOSIDASE":     "Alpha-glucosidase inhibitor",
    r"SGLT2":           "SGLT2 inhibitor",
    r"HDAC":            "HDAC inhibitor",
    r"SIRT":            "Sirtuin activator",
    r"BCL":             "Senolytic (BCL family)",
    r"GLUTATHIONE":     "Antioxidant precursor",
    r"ANTIOXIDANT":     "Antioxidant",
    r"KETONE":          "Ketone / CR mimetic",
}

client = httpx.Client(timeout=10)

def guess_class(moa: str) -> str | None:
    moa_up = moa.upper()
    for pat, cls in MOA_KEYWORDS.items():
        if re.search(pat, moa_up):
            return cls
    return None

updated = 0
for row in compounds:
    if row["class"] != "Unclassified":
        continue
    drug = row["compound"]
    try:
        r = client.get(f"https://www.ebi.ac.uk/chembl/api/data/mechanism.json?molecule_pref_name={drug}&limit=1")
        mech_list = r.json().get("mechanisms", [])
        if not mech_list:
            continue
        moa_text = mech_list[0]["mechanism_of_action"]
        maybe = guess_class(moa_text or "")
        if maybe:
            row["class"] = maybe
            updated += 1
            time.sleep(0.1)   # gentle on API
    except Exception:
        pass

print(f"Auto-annotated {updated} previously unclassified compounds.")
JSON_PATH.write_text(json.dumps(compounds, indent=2))
