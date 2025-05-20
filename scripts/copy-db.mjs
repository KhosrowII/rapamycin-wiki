import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const src = path.join(PROJECT_ROOT, "db.sqlite");

// prefer .next/standalone; fall back to .next if standalone doesn’t exist
let destDir = path.join(PROJECT_ROOT, ".next", "standalone");
if (!fs.existsSync(destDir)) destDir = path.join(PROJECT_ROOT, ".next");

fs.mkdirSync(destDir, { recursive: true });   // ensure directory exists

const dest = path.join(destDir, "db.sqlite");

if (!fs.existsSync(src)) {
  console.error("❌  db.sqlite not found at", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("✅  copied db.sqlite into", destDir);
