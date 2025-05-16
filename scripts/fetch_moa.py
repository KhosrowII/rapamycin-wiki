#!/usr/bin/env python
"""
fetch_moa.py  – robust ChEMBL wrapper with safety checks

• Exact name match → return mechanism_of_action string
• No match        → return ""   (leave for manual curation)
• Caches in data/moa_cache.json
"""

# FIX-MOA --------------------------------------------------------------------
import json, pathlib, requests, urllib.parse

CACHE = pathlib.Path("data/moa_cache.json")
cache: dict[str, str] = {}
if CACHE.exists():
    cache.update(json.load(CACHE.open()))

CHEMBL_BASE = "https://www.ebi.ac.uk/chembl/api/data"

def get_moa(name: str) -> str:
    key = name.lower()
    if key in cache:
        return cache[key]

    try:
        # 1 ── search for the molecule first (more reliable)
        q = urllib.parse.quote_plus(name)
        mol_url = f"{CHEMBL_BASE}/molecule.json?pref_name__iexact={q}&limit=1"
        mol = requests.get(mol_url, timeout=8).json()

        if not mol.get("molecules"):
            cache[key] = ""
            return ""

        chembl_id = mol["molecules"][0]["molecule_chembl_id"]

        # 2 ── fetch mechanism for that chembl_id
        mech_url = f"{CHEMBL_BASE}/mechanism.json?molecule_chembl_id={chembl_id}"
        mech = requests.get(mech_url, timeout=8).json()

        if not mech.get("mechanisms"):
            cache[key] = ""
            return ""

        moa = mech["mechanisms"][0]["mechanism_of_action"]

    except Exception:
        moa = ""

    cache[key] = moa
    CACHE.parent.mkdir(exist_ok=True)
    json.dump(cache, CACHE.open("w"), indent=2)
    return moa
# ----------------------------------------------------------------------------
