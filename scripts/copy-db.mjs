import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// absolute path to <project-root>
const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const src      = path.join(PROJECT_ROOT, "db.sqlite");
const destDir  = path.join(PROJECT_ROOT, ".next", "standalone");
const dest     = path.join(destDir,  "db.sqlite");

if (!fs.existsSync(src)) {
  console.error("❌  db.sqlite not found at", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("✅  copied db.sqlite into .next/standalone");
