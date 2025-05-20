// scripts/fetch_trials.js
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const BASE = "https://clinicaltrials.gov/api/v2/studies";
// always write to <project-root>/db.sqlite
const DB_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "db.sqlite");
const KW_PATH = path.resolve(process.cwd(), "scripts", "keywords.csv");

async function fetchStudies(keyword) {
  const params = new URLSearchParams({
    "query.intr": keyword,
    "filter.overallStatus": "RECRUITING|NOT_YET_RECRUITING",
    pageSize: "200",
    format: "json",
  });
  const res = await fetch(`${BASE}?${params}`);
  res.raiseForStatus?.();
  const json = await res.json();
  return json.studies || [];
}

(async () => {
  // read keywords
  const keywords = fs.readFileSync(KW_PATH, "utf-8")
    .split(/\r?\n/)
    .filter(Boolean);

  // open or create DB
  const db = new sqlite3.Database(DB_PATH);
  await new Promise((res, rej) =>
    db.run(
      `CREATE TABLE IF NOT EXISTS trials (
         nct     TEXT PRIMARY KEY,
         keyword TEXT,
         title   TEXT,
         start   TEXT,
         status  TEXT
       )`,
      (err) => (err ? rej(err) : res())
    )
  );

  // upsert each study
  const insertStmt = db.prepare(
    `INSERT OR REPLACE INTO trials (nct, keyword, title, start, status)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const kw of keywords) {
    const studies = await fetchStudies(kw);
    for (const s of studies) {
      const mod = s.protocolSection;
      const idm = mod.identificationModule;
      const stm = mod.statusModule;
      const raw = stm.startDateStruct?.date;
      const start = raw?.length === 7 ? raw + "-01" : raw;
      insertStmt.run(
        idm.nctId,
        kw,
        idm.briefTitle || "—",
        start,
        stm.overallStatus
      );
    }
  }

  insertStmt.finalize();
  db.close();
  console.log("✅  fetch_trials.js: db.sqlite refreshed");
})();
