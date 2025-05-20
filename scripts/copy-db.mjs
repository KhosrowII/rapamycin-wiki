import fs from "fs";
import path from "path";

const src = path.resolve("db.sqlite");               // <root>/db.sqlite
const destDir = path.resolve(".next/standalone");    // created by next build
const dest = path.join(destDir, "db.sqlite");

if (!fs.existsSync(src)) {
  console.error("❌  db.sqlite not found at", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("✅  copied db.sqlite into .next/standalone");
