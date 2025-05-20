// scripts/copy-db.mjs   (replace entire file)
import fs from "fs";
import path from "path";

// Next.js project directory
const projectDir = path.resolve("lifespan-ui2");

// Source DB *inside* the project folder
const src = path.join(projectDir, "db.sqlite");

// Destination = bundle root *inside* the same folder
const destDir = path.join(projectDir, ".next", "standalone");
const dest = path.join(destDir, "db.sqlite");

//   Bail out if we didn't find the database
if (!fs.existsSync(src)) {
  console.error("❌ db.sqlite not found at", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("✅ copied db.sqlite into", destDir);
