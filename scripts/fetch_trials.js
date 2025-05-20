// scripts/fetch_trials.js
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const BASE = "https://clinicaltrials.gov/api/v2/studies";

// absolute path to <project-root>
const __filename   = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..");

const DB_PATH = path.join(PROJECT_ROOT, "db.sqlite");
const KW_PATH = path.join(PROJECT_ROOT, "scripts", "keywords.csv");

async function fetchStudies(keyword) {
  const params = new URLSearchParams({
    "query.intr": keyword,
    "filter.overallStatus": "RECRUITING|NOT_YET_RECRUITING",
    pageSize: "200",
    format: "json",
  });
  const res = await fetch(`${BASE}?${params}`);
  const json = await res.json();
  return json.studies || [];
}

(async () => {
  // ensure scripts/keywords.csv exists
  if (!fs.existsSync(KW_PATH)) {
    console.error("❌  keywords.csv missing at", KW_PATH);
    process.exit(1);
  }

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
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO trials (nct, keyword, title, start, status)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const kw of keywords) {
    const studies = await fetchStudies(kw);
    for (const s of studies) {
      const mod  = s.protocolSection;
      const id   = mod.identificationModule;
      const stat = mod.statusModule;
      const raw  = stat.startDateStruct?.date;
      const start = raw?.length === 7 ? raw + "-01" : raw;
      stmt.run(id.nctId, kw, id.briefTitle || "—", start, stat.overallStatus);
    }
  }

  stmt.finalize();
  db.close();
  console.log("✅  fetch_trials.js: db.sqlite refreshed at", DB_PATH);
})();
