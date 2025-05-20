#!/usr/bin/env python3
import csv, os, sqlite3, requests, time

BASE = "https://clinicaltrials.gov/api/v2/studies"
DB   = os.path.join(os.path.dirname(__file__), "..", "db.sqlite")
KW   = os.path.join(os.path.dirname(__file__), "keywords.csv")

def fetch(keyword: str):
    params = {
        "query.intr": keyword,
        "filter.overallStatus": "RECRUITING|NOT_YET_RECRUITING",
        "pageSize": "200",
        "format": "json"
    }
    headers = {"Accept": "application/json"}
    r = requests.get(BASE, params=params, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json().get("studies", [])

with sqlite3.connect(DB) as cx:
    cx.execute("""CREATE TABLE IF NOT EXISTS Trial (
      nct     TEXT PRIMARY KEY,
      keyword TEXT,
      title   TEXT,
      start   TEXT,
      status  TEXT
    )""")

    for kw in [row[0] for row in csv.reader(open(KW, newline="")) if row]:
        for s in fetch(kw):
            mod    = s["protocolSection"]
            idmod  = mod["identificationModule"]
            stat   = mod["statusModule"]
            cx.execute("""
              INSERT OR REPLACE INTO Trial
                (nct, keyword, title, start, status)
              VALUES (?,?,?,?,?)
            """, (
              idmod["nctId"],
              kw,
              idmod.get("briefTitle", "—"),
              stat.get("startDateStruct", {}).get("date"),
              stat.get("overallStatus")
            ))
    cx.commit()

print("✅  Trial table refreshed", time.strftime("%F %T"))
