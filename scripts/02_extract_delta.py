#!/usr/bin/env python
"""
02_extract_delta.py
  Reliable PubMed -> TSV extractor
  • compound  = first MeSH / Chemical name
  • delta %   = % within 30 chars of 'lifespan|life span|survival'
  • species   = mesh heading match
  • year      = PubDate or MedlineDate (4-digit)
  • falls back to GPT-4o *only* if percent was found but compound absent
"""

import csv, json, re, pathlib, requests, xml.etree.ElementTree as ET, os, time
from dotenv import load_dotenv
import openai

# ---- configuration ---------------------------------------------------------
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

IN   = pathlib.Path("data/pubmed_new.json")
OUT  = pathlib.Path("data/pubmed_parsed.tsv")

PMIDS = json.load(IN.open()) if IN.exists() else []

rx_near  = re.compile(
    r"(lifespan|life span|survival).{0,30}?([+-]?\d+\.?\d*)\s?%", re.I)
rx_species_mesh = re.compile(
    r"(Caenorhabditis|Drosophila|Mouse|Rats?|Mice|Mus)", re.I)

def mesh_compound(root: ET.Element) -> str | None:
    for chem in root.findall(".//ChemicalName"):
        name = chem.text or ""
        if not name.lower().startswith(("drug", "substance")):
            return name.capitalize()
    return None

def year_from_xml(root: ET.Element) -> int | None:
    txt = (root.findtext(".//PubDate/Year") or
           root.findtext(".//PubDate/MedlineDate") or "")
    m = re.search(r"(\d{4})", txt)
    return int(m.group(1)) if m else None

def gpt_compound(blob: str) -> str | None:
    prompt = ( "What compound or drug name (single word) is being tested for"
               " lifespan extension in the text below? Reply ONLY that word "
               "or 'None'." )
    try:
        rsp = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"user","content":f"{prompt}\n\n{blob[:800]}"}],
            temperature=0,
            max_tokens=4,
        )
        ans = rsp.choices[0].message.content.strip()
        return None if ans.lower()=="none" else ans.split()[0].capitalize()
    except Exception:
        return None

with OUT.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["pmid","delta","species","compound","year"])
    for pmid in PMIDS:
        url = ("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?"
               f"db=pubmed&id={pmid}&retmode=xml")
        try:
            xml = requests.get(url, timeout=8).text
            root = ET.fromstring(xml)
        except Exception:
            continue

        # 1  abstract blob
        title    = root.findtext(".//ArticleTitle") or ""
        abstract = " ".join((A.text or "") for A in root.findall(".//AbstractText"))
        blob     = f"{title} {abstract}"

        # 2  delta %
        m = rx_near.search(blob)
        if not m:
            continue
        delta = float(m.group(2))

        # 3  species (mesh heading list best)
        mesh_txt = " ".join(M.text or "" for M in root.findall(".//MeshHeading/DescriptorName"))
        s = rx_species_mesh.search(mesh_txt) or rx_species_mesh.search(blob)
        if not s:
            continue
        species = s.group(1)

        # 4  compound
        compound = mesh_compound(root) or gpt_compound(title)
        if not compound:
            continue

        # 5  year
        yr = year_from_xml(root)
        if not yr:
            continue

        w.writerow([pmid, delta, species, compound, yr])
        time.sleep(0.34)   # obey NCBI limit

print("✅  saved", OUT)
