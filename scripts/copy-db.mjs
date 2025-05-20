// scripts/copy-db.mjs
import fs from "fs";
import path from "path";

// Working directory is already the Next.js project root
const src = path.resolve("db.sqlite");                  // <root>/db.sqlite
const destDir = path.resolve(".next/standalone");       // <root>/.next/standalone
const dest = path.join(destDir, "db.sqlite");

if (!fs.existsSync(src)) {
  console.error("❌  db.sqlite not found at", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("✅  copied db.sqlite into .next/standalone");
