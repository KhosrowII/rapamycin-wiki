#!/usr/bin/env python
"""
Fetch PMIDs added in the last 7 days that contain the words
'lifespan' or 'life span' plus an animal model keyword.
Writes data/pubmed_new.json = [ "38612345", … ]
"""

# FIX-IMPORTS -----------------------------------------------------------------
import json, time, datetime, pathlib, requests, urllib.parse

OUT = pathlib.Path("data/pubmed_new.json")

# FIX-QUERY -------------------------------------------------------------------
MODEL = "(Caenorhabditis OR Drosophila OR mouse OR rat OR mus OR rattus)"
KW    = '("lifespan"[Title/Abstract] OR "life span"[Title/Abstract])'
term  = f"{KW} AND {MODEL}"

# last 7 days
reldate = 1825

url = (
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?"
    + urllib.parse.urlencode(
        {
            "db": "pubmed",
            "term": term,
            "reldate": reldate,
            "datetype": "edat",
            "retmax": 500,
            "retmode": "json",
        }
    )
)

pmids = requests.get(url, timeout=10).json()["esearchresult"]["idlist"]

OUT.parent.mkdir(exist_ok=True)
json.dump(pmids, OUT.open("w"), indent=2)
print(f"✅  fetched {len(pmids)} new PMIDs → {OUT}")
