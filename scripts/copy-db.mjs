// scripts/copy-db.mjs
import fs from "fs";
import path from "path";

// Vercel’s build root is /vercel/path0 (your repo root)
// but your Next.js project (and db.sqlite) sits in "lifespan-ui2/"
const projectDir = path.resolve(process.cwd(), "lifespan-ui2");
const src = path.join(projectDir, "db.sqlite");
const destDir = path.resolve(
  projectDir,
  ".next",
  "standalone"
);
const dest = path.join(destDir, "db.sqlite");

if (!fs.existsSync(src)) {
  console.error("❌ db.sqlite not found at", src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("✅ copied db.sqlite into", destDir);
